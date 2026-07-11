import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, publicUser, ensureSeedUsers } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  await ensureSeedUsers();
  const customer = await getUserFromRequest(req, "customer");
  if (!customer || customer.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, customer: publicUser(customer) });
}
