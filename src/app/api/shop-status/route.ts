import { NextRequest, NextResponse } from "next/server";
import { getShopStatus, setShopStatus } from "@/src/lib/ownerSettings";
import { fetchShopStatusFromSheet } from "@/src/lib/googleSheetStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sheetStatus = await fetchShopStatusFromSheet();
    const status = sheetStatus || getShopStatus();

    return NextResponse.json({ status, source: sheetStatus ? "google-sheet" : "local" });

  } catch (error) {
    console.error("Shop status error:", error);
    return NextResponse.json({ status: "OPEN" });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { status } = await req.json();
    const nextStatus = status === "CLOSED" ? "CLOSED" : "OPEN";
    setShopStatus(nextStatus);
    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Shop status update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update shop status" }, { status: 500 });
  }
}
