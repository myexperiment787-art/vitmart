import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sheetUrl = process.env.GOOGLE_SHEET_URL; // your apps script URL
    
    if (!sheetUrl) {
      return NextResponse.json({ status: "OPEN" });
    }

    const res = await fetch(sheetUrl, { cache: "no-store" });
    const data = await res.json();

    return NextResponse.json({ status: data.status || "OPEN" });
  } catch (error) {
    console.error("Shop status error:", error);
    return NextResponse.json({ status: "OPEN" }); // default to open if error
  }
}