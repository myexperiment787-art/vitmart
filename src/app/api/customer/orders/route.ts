import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest } from "@/src/lib/auth";
import { getOrdersByCustomer } from "@/src/lib/orders";
import { isDatabaseConfigured } from "@/src/lib/db";

type CustomerOrderRecord = {
  id?: unknown;
  restaurant_name?: unknown;
  restaurantName?: unknown;
  items?: unknown;
  total?: unknown;
  timestamp?: unknown;
  status?: unknown;
  driver?: unknown;
  customer_address?: unknown;
  customerAddress?: unknown;
};

function normalizeOrder(order: CustomerOrderRecord) {
  return {
    id: String(order.id ?? ""),
    restaurantName: String(order.restaurant_name ?? order.restaurantName ?? ""),
    items: String(order.items ?? ""),
    total: Number(order.total ?? 0),
    timestamp: Number(order.timestamp ?? Date.now()),
    status: String(order.status ?? "pending"),
    driver: typeof order.driver === "string" ? order.driver : undefined,
    customerAddress:
      typeof order.customer_address === "string"
        ? order.customer_address
        : typeof order.customerAddress === "string"
        ? order.customerAddress
        : undefined,
  };
}

export async function GET(req: NextRequest) {
  await ensureSeedUsers();
  const customer = await getUserFromRequest(req, "customer");
  if (!customer || customer.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getOrdersByCustomer(customer.phone || customer.id);

  return NextResponse.json({
    success: true,
    orders: isDatabaseConfigured() ? orders.map(normalizeOrder) : orders.map(normalizeOrder),
  });
}
