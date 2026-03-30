import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!sheetUrl) {
      return NextResponse.json({ status: "OPEN" });
    }

    // Google Apps Script requires following redirects
    const res = await fetch(sheetUrl, {
      method: "GET",
      redirect: "follow",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    console.log("Shop status raw response:", text);

    try {
      const data = JSON.parse(text);
      return NextResponse.json({ status: data.status || "OPEN" });
    } catch {
      console.error("JSON parse failed:", text);
      return NextResponse.json({ status: "OPEN" });
    }

  } catch (error) {
    console.error("Shop status error:", error);
    return NextResponse.json({ status: "OPEN" });
  }
}