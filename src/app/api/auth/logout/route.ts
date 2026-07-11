import { NextRequest, NextResponse } from "next/server";
import { deleteSession, sessionCookieName } from "@/src/lib/auth";
import type { UserRole } from "@/src/lib/auth";

const sessionRoles: UserRole[] = ["customer", "delivery", "owner"];

async function readRequestedRole(req: NextRequest) {
  try {
    const body = await req.json();
    const role = String(body?.role || "") as UserRole;
    return sessionRoles.includes(role) ? role : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestedRole = await readRequestedRole(req);
  const cookieNames = requestedRole
    ? [sessionCookieName(requestedRole)]
    : [...sessionRoles.map((role) => sessionCookieName(role)), sessionCookieName()];
  const response = NextResponse.json({ success: true });

  for (const cookieName of cookieNames) {
    const token = req.cookies.get(cookieName)?.value;
    if (token) await deleteSession(token);
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
