import { NextRequest, NextResponse } from "next/server";
import { changePassword, getUserFromRequest } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, error: "Current and new password are required" }, { status: 400 });
  }

  if (String(newPassword).length < 8) {
    return NextResponse.json({ success: false, error: "New password must be at least 8 characters" }, { status: 400 });
  }

  const ok = await changePassword(user.id, String(currentPassword), String(newPassword));
  if (!ok) {
    return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
