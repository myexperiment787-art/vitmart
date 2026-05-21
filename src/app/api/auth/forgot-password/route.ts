import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  const { phone, role } = await req.json();
  if (!phone || !role) {
    return NextResponse.json({ success: false, error: "Phone and role are required" }, { status: 400 });
  }

  const data = await createPasswordResetToken(String(phone), role);
  if (!data) {
    return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
  }

  const resetUrl = `/auth/change-password?token=${encodeURIComponent(data.token)}&role=${encodeURIComponent(role)}`;
  return NextResponse.json({ success: true, resetUrl, token: data.token });
}
