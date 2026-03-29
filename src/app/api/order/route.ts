import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt } = await req.json();

    // Dynamically import razorpay to avoid build issues
    const Razorpay = (await import("razorpay")).default;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    console.error("❌ Razorpay order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Order creation failed" },
      { status: 500 }
    );
  }
}