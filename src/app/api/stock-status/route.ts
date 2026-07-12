import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest } from "@/src/lib/auth";
import { getOutOfStockItems, ownerSettingsPersistenceSource, setGlobalOutOfStockItems, setRestaurantOutOfStockItems, toggleRestaurantItemAvailability } from "@/src/lib/ownerSettings";
import { fetchOutOfStockItemsFromSheet, mergeOutOfStockItems } from "@/src/lib/googleSheetStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const parsedRestaurantId = restaurantId ? Number.parseInt(restaurantId) : undefined;
    const sheetItems = await fetchOutOfStockItemsFromSheet(parsedRestaurantId);
    const savedItems = await getOutOfStockItems(parsedRestaurantId);
    const outOfStockItems = mergeOutOfStockItems(sheetItems, savedItems);

    return NextResponse.json({
      success: true,
      outOfStockItems,
      source: sheetItems ? "google-sheet+saved" : "saved",
      persistence: ownerSettingsPersistenceSource(),
      persistent: ownerSettingsPersistenceSource() === "database",
    });

  } catch (error) {
    console.error("Stock status error:", error);
    return NextResponse.json({ success: false, error: "Failed to load stock status" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const owner = await getUserFromRequest(req, "owner");
    if (!owner || owner.role !== "owner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const restaurantId = Number.parseInt(String(body.restaurantId || ""));

    if (body.restaurantId && body.itemName) {
      const nextItems = await toggleRestaurantItemAvailability(
        restaurantId,
        String(body.itemName),
        body.available !== false
      );
      return NextResponse.json({
        success: true,
        outOfStockItems: nextItems,
        persistence: ownerSettingsPersistenceSource(),
        persistent: ownerSettingsPersistenceSource() === "database",
      });
    }

    if (Array.isArray(body.outOfStockItems)) {
      if (body.restaurantId) {
        const nextItems = await setRestaurantOutOfStockItems(restaurantId, body.outOfStockItems.map(String));
        return NextResponse.json({
          success: true,
          outOfStockItems: nextItems,
          persistence: ownerSettingsPersistenceSource(),
          persistent: ownerSettingsPersistenceSource() === "database",
        });
      }

      const nextItems = await setGlobalOutOfStockItems(body.outOfStockItems.map(String));
      return NextResponse.json({
        success: true,
        outOfStockItems: nextItems,
        persistence: ownerSettingsPersistenceSource(),
        persistent: ownerSettingsPersistenceSource() === "database",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid stock update payload" }, { status: 400 });
  } catch (error) {
    console.error("Stock status update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update stock status" }, { status: 500 });
  }
}
