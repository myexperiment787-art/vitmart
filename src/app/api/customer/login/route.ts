import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, ensureSeedUsers, normalizePhone, publicUser } from "@/src/lib/auth";

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
    const customer = await authenticate(normalized, String(password), "customer");
    console.log('[customer/login] user found=', Boolean(customer));

    if (!customer) {
      return NextResponse.json({ success: false, error: "Invalid phone or password" }, { status: 401 });
    }

    const session = await createSession(customer.id);

    const response = NextResponse.json({
      success: true,
      customer: publicUser(customer),
    });
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
