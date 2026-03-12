import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt } = await req.json();
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Order creation failed" }, { status: 500 });
  }
}