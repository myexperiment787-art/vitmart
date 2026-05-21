import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, deleteSession } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/(?:^|;\s*)quickmart_session=([^;]+)/);
  if (sessionMatch) await deleteSession(decodeURIComponent(sessionMatch[1]));

  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearAuthCookie());
  return response;
}
