import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest } from "@/src/lib/auth";
import { isDatabaseConfigured } from "@/src/lib/db";
import { getOrderHistory } from "@/src/lib/orders";
import type { AppOrder } from "@/src/lib/orders";

type OrderRecord = Partial<AppOrder> & {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string | null;
  itemAmount?: number;
  paymentId?: string | null;
  restaurantName?: string;
  restaurantId?: number;
};

function mapOrder(o: OrderRecord) {
  return {
    id: String(o.id ?? ""),
    customerName: o.customer_name ?? o.customerName ?? "",
    customerPhone: o.customer_phone ?? o.customerPhone ?? "",
    customerAddress: o.customer_address ?? o.customerAddress ?? null,
    driver: o.driver ?? null,
    items: o.items ?? "",
    itemAmount: Number(o.item_amount ?? o.itemAmount ?? 0),
    total: Number(o.total ?? 0),
    paymentId: o.payment_id ?? o.paymentId ?? null,
    timestamp: Number(o.timestamp ?? Date.now()),
    restaurantName: o.restaurant_name ?? o.restaurantName ?? "Unknown restaurant",
    restaurantId: Number(o.restaurant_id ?? o.restaurantId ?? 0),
    status: o.status ?? "pending",
  };
}

function dateKey(timestamp: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const owner = await getUserFromRequest(req, "owner");
    if (!owner || owner.role !== "owner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const restaurantIdParam = searchParams.get("restaurantId");
    const restaurantId = restaurantIdParam ? Number(restaurantIdParam) : undefined;
    const orders = (await getOrderHistory(restaurantId)).map(mapOrder);

    const byRestaurant = Array.from(
      orders.reduce((map, order) => {
        const key = String(order.restaurantId || order.restaurantName);
        const current = map.get(key) || {
          restaurantId: order.restaurantId,
          restaurantName: order.restaurantName,
          orderCount: 0,
          totalAmount: 0,
          latestTimestamp: 0,
        };
        current.orderCount += 1;
        current.totalAmount += Number(order.total || 0);
        current.latestTimestamp = Math.max(current.latestTimestamp, Number(order.timestamp || 0));
        map.set(key, current);
        return map;
      }, new Map<string, { restaurantId: number; restaurantName: string; orderCount: number; totalAmount: number; latestTimestamp: number }>())
    ).map(([, value]) => value);

    const byDate = Array.from(
      orders.reduce((map, order) => {
        const key = dateKey(order.timestamp);
        const current = map.get(key) || { date: key, orderCount: 0, totalAmount: 0 };
        current.orderCount += 1;
        current.totalAmount += Number(order.total || 0);
        map.set(key, current);
        return map;
      }, new Map<string, { date: string; orderCount: number; totalAmount: number }>())
    )
      .map(([, value]) => value)
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      success: true,
      persistent: isDatabaseConfigured(),
      counts: {
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        restaurants: byRestaurant.length,
      },
      byRestaurant,
      byDate,
      orders,
    });
  } catch (error) {
    console.error("Owner order history error:", error);
    return NextResponse.json({ success: false, error: "Failed to load order history" }, { status: 500 });
  }
}
