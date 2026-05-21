import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, publicUser, ensureSeedUsers } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  await ensureSeedUsers();
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: publicUser(user) });
}
