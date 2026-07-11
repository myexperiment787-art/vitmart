import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, createUser, ensureSeedUsers, findUserByPhone, isUserDisabled, normalizePhone, publicUser, sessionCookieName } from "@/src/lib/auth";
import { hashPassword } from "@/src/lib/customerAuth";
import { verifyCustomerAccount } from "@/src/lib/customerBrowserAuth";
import { checkRateLimit } from "@/src/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: "Phone and password are required" }, { status: 400 });
    }

    const normalized = normalizePhone(String(phone));
    const rateLimit = checkRateLimit(req, "login:customer", normalized, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    let customer = await authenticate(normalized, String(password), "customer");

    if (!customer) {
      const existingCustomer = await findUserByPhone(normalized, "customer");
      if (isUserDisabled(existingCustomer)) {
        return NextResponse.json({ success: false, error: "This customer account is disabled. Please contact the owner." }, { status: 403 });
      }

      const legacyAccount = !existingCustomer
        ? verifyCustomerAccount(req, normalized, hashPassword(String(password)))
        : null;

      if (legacyAccount) {
        customer = await createUser({
          name: legacyAccount.name,
          phone: legacyAccount.phone,
          password: String(password),
          role: "customer",
        });
      }
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: "Invalid phone or password" }, { status: 401 });
    }

    const session = await createSession(customer);

    const response = NextResponse.json({
      success: true,
      customer: publicUser(customer),
    });

    response.cookies.set({
      name: sessionCookieName("customer"),
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
