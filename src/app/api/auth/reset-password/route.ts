import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword) {
    return NextResponse.json({ success: false, error: "Token and new password are required" }, { status: 400 });
  }

  if (String(newPassword).length < 4) {
    return NextResponse.json({ success: false, error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const user = await resetPassword(String(token), String(newPassword));
  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
