import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, ensureSeedUsers, normalizePhone, publicUser, sessionCookieName, UserRole } from "@/src/lib/auth";
import { checkRateLimit } from "@/src/lib/rateLimit";

const allowedRoles: UserRole[] = ["owner", "delivery"];

export async function POST(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const { phone, password, role } = await req.json();
    const requestedRole = String(role || "") as UserRole;

    if (!allowedRoles.includes(requestedRole)) {
      return NextResponse.json({ success: false, error: "Invalid login role" }, { status: 400 });
    }

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: "Phone and password are required" }, { status: 400 });
    }

    const rateLimit = checkRateLimit(req, `login:${requestedRole}`, normalizePhone(String(phone)), {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const user = await authenticate(String(phone), String(password), requestedRole);
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid phone or password" }, { status: 401 });
    }

    const session = await createSession(user);
    const response = NextResponse.json({ success: true, user: publicUser(user) });
    response.cookies.set({
      name: sessionCookieName(requestedRole),
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
