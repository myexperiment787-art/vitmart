import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest } from "@/src/lib/auth";
import { getShopStatus, ownerSettingsPersistenceSource, setShopStatus } from "@/src/lib/ownerSettings";
import { fetchShopStatusFromSheet } from "@/src/lib/googleSheetStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = Number.parseInt(searchParams.get("restaurantId") || "");

    if (Number.isFinite(restaurantId)) {
      return NextResponse.json({
        success: true,
        status: await getShopStatus(restaurantId),
        source: "saved-restaurant",
        persistence: ownerSettingsPersistenceSource(),
        persistent: ownerSettingsPersistenceSource() === "database",
      });
    }

    const sheetStatus = await fetchShopStatusFromSheet();
    const status = sheetStatus || await getShopStatus();

    return NextResponse.json({
      success: true,
      status,
      source: sheetStatus ? "google-sheet" : "saved",
      persistence: ownerSettingsPersistenceSource(),
      persistent: ownerSettingsPersistenceSource() === "database",
    });

  } catch (error) {
    console.error("Shop status error:", error);
    return NextResponse.json({ success: false, error: "Failed to load shop status" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const owner = await getUserFromRequest(req, "owner");
    if (!owner || owner.role !== "owner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { status, restaurantId } = await req.json();
    const parsedRestaurantId = Number.parseInt(String(restaurantId || ""));
    const nextStatus = status === "CLOSED" ? "CLOSED" : "OPEN";
    const savedStatus = await setShopStatus(
      nextStatus,
      Number.isFinite(parsedRestaurantId) ? parsedRestaurantId : undefined
    );
    return NextResponse.json({
      success: true,
      status: savedStatus,
      persistence: ownerSettingsPersistenceSource(),
      persistent: ownerSettingsPersistenceSource() === "database",
    });
  } catch (error) {
    console.error("Shop status update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update shop status" }, { status: 500 });
  }
}
