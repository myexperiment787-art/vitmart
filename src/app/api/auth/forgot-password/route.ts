import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, createUser, ensureSeedUsers, normalizePhone } from "@/src/lib/auth";
import type { UserRole } from "@/src/lib/auth";
import { findCustomerAccountByPhone } from "@/src/lib/customerBrowserAuth";
import { checkRateLimit } from "@/src/lib/rateLimit";

const resetRoles: UserRole[] = ["customer"];
const allowInsecureResetLink =
  process.env.ALLOW_INSECURE_PASSWORD_RESET === "true" || process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  const { phone, role } = await req.json();
  if (!phone || !role) {
    return NextResponse.json({ success: false, error: "Phone and role are required" }, { status: 400 });
  }

  await ensureSeedUsers();
  const requestedRole = String(role) as UserRole;
  if (!resetRoles.includes(requestedRole)) {
    return NextResponse.json({ success: false, error: "Invalid account role" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(req, "forgot-password", `${requestedRole}:${normalizePhone(String(phone))}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many reset attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let data = await createPasswordResetToken(String(phone), requestedRole);
  if (!data && requestedRole === "customer") {
    const legacyAccount = findCustomerAccountByPhone(req, String(phone));
    if (legacyAccount) {
      await createUser({
        name: legacyAccount.name,
        phone: legacyAccount.phone,
        password: `reset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "customer",
      });
      data = await createPasswordResetToken(String(phone), requestedRole);
    }
  }

  if (!data) {
    return NextResponse.json({ success: true, message: "If this account exists, a reset link will be sent." });
  }

  const resetUrl = `/auth/change-password?token=${encodeURIComponent(data.token)}&role=${encodeURIComponent(requestedRole)}`;
  if (!allowInsecureResetLink) {
    return NextResponse.json({ success: true, message: "If this account exists, a reset link will be sent." });
  }

  return NextResponse.json({ success: true, resetUrl, token: data.token });
}
