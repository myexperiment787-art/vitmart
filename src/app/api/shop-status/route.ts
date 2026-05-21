import { NextRequest, NextResponse } from "next/server";
import { getShopStatus, setShopStatus } from "@/src/lib/ownerSettings";

export async function GET() {
  try {
    return NextResponse.json({ status: getShopStatus() });

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