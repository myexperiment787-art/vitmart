import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser, normalizePhone, publicUser, ensureSeedUsers } from "@/src/lib/auth";
import { isDatabaseConfigured } from "@/src/lib/db";
import { hashPassword } from "@/src/lib/customerAuth";
import { CustomerAccount, upsertCustomerAccountCookie, readCustomerAccountsFromRequest } from "@/src/lib/customerBrowserAuth";

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

    if (String(password).length < 4) {
      return NextResponse.json({ success: false, error: "Password must be at least 4 characters" }, { status: 400 });
    }

    const customer = isDatabaseConfigured()
      ? await createUser({ name: String(name), phone: normalizedPhone, password: String(password), role: "customer" })
      : ({
          id: `cus_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: String(name).trim(),
          phone: normalizedPhone,
          role: "customer",
          created_at: Date.now(),
        } as const);

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
        phone: normalizedPhone,
        passwordHash: hashPassword(String(password)),
        createdAt: Date.now(),
      };
      const accounts = [...existingAccounts.filter((account) => account.phone !== normalizedPhone), nextAccount];
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
