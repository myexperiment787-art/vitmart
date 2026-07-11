import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/src/lib/auth";
import { checkRateLimit } from "@/src/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword) {
    return NextResponse.json({ success: false, error: "Token and new password are required" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(req, "reset-password", String(token).slice(0, 16), {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many reset attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  if (String(newPassword).length < 8) {
    return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await resetPassword(String(token), String(newPassword));
  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
