import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest, normalizePhone } from "@/src/lib/auth";
import { claimOrderForDelivery, getOrderById, getOrdersByRestaurant, updateOrder } from "@/src/lib/orders";
import { isDatabaseConfigured } from "@/src/lib/db";
import { formatOrderDate, postOrderToSheet } from "../../googleSheetHelper";
import type { AppOrder } from "@/src/lib/orders";

type DeliveryOrderRecord = Partial<AppOrder> & {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string | null;
  itemAmount?: number;
  paymentId?: string | null;
  restaurantName?: string;
  restaurantId?: number;
};

function deliveryDriverLabel(user: { name: string; phone: string }) {
  return `${user.name} (${user.phone})`;
}

function isAssignedToDeliveryUser(orderDriver: string | null | undefined, user: { name: string; phone: string }) {
  if (!orderDriver) return false;

  const driverPhone = normalizePhone(orderDriver);
  if (driverPhone && driverPhone === normalizePhone(user.phone)) return true;

  return orderDriver.trim().toLowerCase() === user.name.trim().toLowerCase();
}

function canDeliverySeeOrder(order: AppOrder, user: { name: string; phone: string }) {
  if (!order.driver) return order.status !== "completed";
  return isAssignedToDeliveryUser(order.driver, user);
}

function mapOrder(o: DeliveryOrderRecord) {
  return {
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
  };
}

async function getDeliveryUser(req: NextRequest) {
  await ensureSeedUsers();
  const user = await getUserFromRequest(req, "delivery");
  if (!user || user.role !== "delivery") return null;
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getDeliveryUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getOrdersByRestaurant();
    const visibleOrders = orders.filter((order) => canDeliverySeeOrder(order, user));

    return NextResponse.json({
      success: true,
      persistent: isDatabaseConfigured(),
      deliveryUser: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        driverLabel: deliveryDriverLabel(user),
      },
      orders: visibleOrders.map(mapOrder),
    });
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch delivery orders" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getDeliveryUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status, assignToMe } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId is required" }, { status: 400 });
    }

    const allowedStatuses = ["picked", "completed"];
    const nextStatus = typeof status === "string" ? status : undefined;
    if (nextStatus && !allowedStatuses.includes(nextStatus)) {
      return NextResponse.json({ success: false, error: "Invalid delivery status" }, { status: 400 });
    }
    if (!assignToMe && !nextStatus) {
      return NextResponse.json({ success: false, error: "No delivery update supplied" }, { status: 400 });
    }

    const order = await getOrderById(String(orderId));
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found", persistent: isDatabaseConfigured() },
        { status: 404 }
      );
    }

    if (order.driver && !isAssignedToDeliveryUser(order.driver, user)) {
      return NextResponse.json(
        { success: false, error: "This order is assigned to another delivery boy", persistent: isDatabaseConfigured() },
        { status: 403 }
      );
    }

    const nextDriver = assignToMe || nextStatus === "picked" || nextStatus === "completed" ? deliveryDriverLabel(user) : undefined;
    if (nextDriver && !order.driver) {
      const claim = await claimOrderForDelivery(String(orderId), {
        driver: nextDriver,
        ...(nextStatus ? { status: nextStatus } : {}),
      });

      if (!claim.claimed) {
        return NextResponse.json(
          {
            success: false,
            error: "This order was already accepted by another delivery boy",
            driver: claim.order?.driver || null,
            persistent: isDatabaseConfigured(),
          },
          { status: 409 }
        );
      }
    } else {
      const changes: { status?: string; driver?: string | null } = {};
      if (nextStatus) changes.status = nextStatus;
      if (nextDriver) changes.driver = nextDriver;
      await updateOrder(String(orderId), changes);
    }

    if (nextDriver && order.restaurant_id && order.restaurant_id > 0) {
      try {
        await postOrderToSheet(order.restaurant_id, {
          orderDate: formatOrderDate(Number(order.timestamp)),
          customerName: order.customer_name || "Not provided",
          items: order.items || "Not provided",
          deliveryAddress: order.customer_address || "Not provided",
          deliveryBoy: nextDriver,
          totalAmount: Number(order.total),
          orderId: order.id,
        });
      } catch (sheetError) {
        console.error("Failed to update delivery boy in Google Sheet:", sheetError);
      }
    }

    return NextResponse.json({
      success: true,
      driver: nextDriver || order.driver || null,
      persistent: isDatabaseConfigured(),
    });
  } catch (error) {
    console.error("Error updating delivery order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update delivery order", persistent: isDatabaseConfigured() },
      { status: 500 }
    );
  }
}
