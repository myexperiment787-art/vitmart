import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers } from "@/src/lib/auth";
import { getOrderById, getOrdersByRestaurant, updateOrder } from "@/src/lib/orders";
import { postOrderToSheet } from "../../googleSheetHelper";

export async function GET(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const orders = await getOrdersByRestaurant(restaurantId ? parseInt(restaurantId) : undefined);

    // Map orders to camelCase keys for client consumption
    const mapped = (orders || []).map((o: any) => ({
      id: o.id,
      customerName: o.customer_name ?? o.customerName ?? "",
      customerPhone: o.customer_phone ?? o.customerPhone ?? "",
      customerAddress: o.customer_address ?? o.customerAddress ?? null,
      driver: o.driver ?? null,
      items: o.items,
      itemAmount: o.item_amount ?? o.itemAmount ?? undefined,
      total: o.total,
      paymentId: o.payment_id ?? o.paymentId ?? null,
      timestamp: Number(o.timestamp ?? Date.now()),
      restaurantName: o.restaurant_name ?? o.restaurantName ?? "",
      restaurantId: Number(o.restaurant_id ?? o.restaurantId ?? 0),
      status: o.status,
    }));

    return NextResponse.json({ success: true, orders: mapped });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: false, error: "Direct owner order creation is disabled" }, { status: 405 });
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const { orderId, status, assignDriver } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId is required" }, { status: 400 });
    }

    const existingOrder = await getOrderById(String(orderId));
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    await updateOrder(String(orderId), {
      status: typeof status === "string" ? status : undefined,
      driver: assignDriver ? String(assignDriver) : undefined,
    });

    if (assignDriver) {
      const order = existingOrder;
      if (order.restaurant_id && order.restaurant_id > 0) {
        await postOrderToSheet(order.restaurant_id, {
          orderDate: new Date(Number(order.timestamp)).toLocaleString("en-IN"),
          customerName: order.customer_name || "Not provided",
          items: order.items || "Not provided",
          deliveryAddress: order.customer_address || "Not provided",
          deliveryBoy: String(assignDriver),
          totalAmount: Number(order.total),
          orderId: order.id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}
