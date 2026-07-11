import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser, findUserByPhone, isUserDisabled, normalizePhone, publicUser, ensureSeedUsers, sessionCookieName } from "@/src/lib/auth";
import { checkRateLimit } from "@/src/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const { name, phone, password } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ success: false, error: "Name, phone and password are required" }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(String(phone));
    if (normalizedPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit phone number" }, { status: 400 });
    }

    const rateLimit = checkRateLimit(req, "signup:customer", normalizedPhone, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingCustomer = await findUserByPhone(normalizedPhone, "customer");
    if (existingCustomer) {
      if (isUserDisabled(existingCustomer)) {
        return NextResponse.json(
          { success: false, error: "This phone number has been disabled by the owner and cannot create a new account." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Phone number is already registered. Please login or reset your password." },
        { status: 409 }
      );
    }

    const customer = await createUser({ name: String(name), phone: normalizedPhone, password: String(password), role: "customer" });

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
