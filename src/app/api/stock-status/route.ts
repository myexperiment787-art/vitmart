import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stockSheetUrl = process.env.GOOGLE_STOCK_SHEET_URL;

    if (!stockSheetUrl) {
      // Return empty array if no sheet URL is configured
      return NextResponse.json({ outOfStockItems: [] });
    }

    // Fetch out-of-stock items from Google Apps Script
    const res = await fetch(stockSheetUrl, {
      method: "GET",
      redirect: "follow",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    console.log("Stock status raw response:", text);

    try {
      const data = JSON.parse(text);
      // Expected format: { outOfStockItems: ["Item 1", "Item 2"] }
      const outOfStockItems = data.outOfStockItems || [];
      return NextResponse.json({ outOfStockItems });
    } catch {
      console.error("JSON parse failed:", text);
      return NextResponse.json({ outOfStockItems: [] });
    }

  } catch (error) {
    console.error("Stock status error:", error);
    return NextResponse.json({ outOfStockItems: [] });
  }
}
