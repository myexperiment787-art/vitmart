import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, ensureSeedUsers, normalizePhone, publicUser } from "@/src/lib/auth";
import { isDatabaseConfigured } from "@/src/lib/db";
import { hashPassword } from "@/src/lib/customerAuth";
import { verifyCustomerAccount, upsertCustomerAccountCookie, CustomerAccount, readCustomerAccountsFromRequest } from "@/src/lib/customerBrowserAuth";

export async function POST(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: "Phone and password are required" }, { status: 400 });
    }
    console.log('[customer/login] submitted phone=', String(phone));
    const normalized = normalizePhone(String(phone));
    console.log('[customer/login] normalized phone=', normalized);
    const customer = isDatabaseConfigured()
      ? await authenticate(normalized, String(password), "customer")
      : (() => {
          const account = verifyCustomerAccount(req, normalized, hashPassword(String(password)));
          return account
            ? ({
                id: account.id,
                name: account.name,
                phone: account.phone,
                role: "customer",
                created_at: account.createdAt,
              } as const)
            : null;
        })();
    console.log('[customer/login] user found=', Boolean(customer));

    if (!customer) {
      return NextResponse.json({ success: false, error: "Invalid phone or password" }, { status: 401 });
    }

    const session = await createSession(customer);

    const response = NextResponse.json({
      success: true,
      customer: publicUser(customer),
    });

    if (!isDatabaseConfigured()) {
      const existingAccounts = readCustomerAccountsFromRequest(req);
      const nextAccount: CustomerAccount = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        passwordHash: hashPassword(String(password)),
        createdAt: Date.now(),
      };
      const accounts = [...existingAccounts.filter((account) => account.phone !== customer.phone), nextAccount];
      response.headers.set("Set-Cookie", upsertCustomerAccountCookie(accounts));
    }

    response.cookies.set({
      name: "quickmart_session",
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
