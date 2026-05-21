import { NextRequest, NextResponse } from "next/server";
import { getOutOfStockItems, setGlobalOutOfStockItems, setRestaurantOutOfStockItems, toggleRestaurantItemAvailability } from "@/src/lib/ownerSettings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const outOfStockItems = getOutOfStockItems(restaurantId ? Number.parseInt(restaurantId) : undefined);
    return NextResponse.json({ outOfStockItems });

  } catch (error) {
    console.error("Stock status error:", error);
    return NextResponse.json({ outOfStockItems: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const restaurantId = Number.parseInt(String(body.restaurantId || ""));

    if (body.restaurantId && body.itemName) {
      const nextItems = toggleRestaurantItemAvailability(
        restaurantId,
        String(body.itemName),
        body.available !== false
      );
      return NextResponse.json({ success: true, outOfStockItems: nextItems });
    }

    if (Array.isArray(body.outOfStockItems)) {
      if (body.restaurantId) {
        const nextItems = setRestaurantOutOfStockItems(restaurantId, body.outOfStockItems.map(String));
        return NextResponse.json({ success: true, outOfStockItems: nextItems });
      }

      const nextItems = setGlobalOutOfStockItems(body.outOfStockItems.map(String));
      return NextResponse.json({ success: true, outOfStockItems: nextItems });
    }

    return NextResponse.json({ success: false, error: "Invalid stock update payload" }, { status: 400 });
  } catch (error) {
    console.error("Stock status update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update stock status" }, { status: 500 });
  }
}
