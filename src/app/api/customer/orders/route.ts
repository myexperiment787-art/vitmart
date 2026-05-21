import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest } from "@/src/lib/auth";
import { getOrdersByCustomer } from "@/src/lib/orders";
import { isDatabaseConfigured } from "@/src/lib/db";

function normalizeOrder(order: any) {
  return {
    id: String(order.id ?? ""),
    restaurantName: String(order.restaurant_name ?? order.restaurantName ?? ""),
    items: String(order.items ?? ""),
    total: Number(order.total ?? 0),
    timestamp: Number(order.timestamp ?? Date.now()),
    status: String(order.status ?? "pending"),
    driver: order.driver ?? undefined,
    customerAddress: order.customer_address ?? order.customerAddress ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  await ensureSeedUsers();
  const customer = await getUserFromRequest(req);
  if (!customer || customer.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getOrdersByCustomer(customer.phone || customer.id);

  return NextResponse.json({
    success: true,
    orders: isDatabaseConfigured() ? orders.map(normalizeOrder) : orders.map(normalizeOrder),
  });
}
