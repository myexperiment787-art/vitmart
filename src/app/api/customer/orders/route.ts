import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest } from "@/src/lib/auth";
import { getOrdersByCustomer } from "@/src/lib/orders";

export async function GET(req: NextRequest) {
  await ensureSeedUsers();
  const customer = await getUserFromRequest(req);
  if (!customer || customer.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getOrdersByCustomer(customer.id);

  return NextResponse.json({ success: true, orders });
}
