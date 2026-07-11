import { NextRequest, NextResponse } from "next/server";
import { validateOrderAvailability } from "@/src/lib/orderAvailability";
import { calculateOrderPricing } from "@/src/lib/orderPricing";
import { checkRateLimit } from "@/src/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt, cartItems, restaurantId } = await req.json();

    const rateLimit = checkRateLimit(req, "create-razorpay-order", String(restaurantId || "food"), {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many payment attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const pricing = calculateOrderPricing(cartItems, restaurantId, amount);
    await validateOrderAvailability(pricing);

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!secret || !keyId) {
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 });
    }

    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: secret,
    });

    const order = await razorpay.orders.create({
      amount: pricing.total * 100,
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json({ success: true, order, pricing });
  } catch (error: unknown) {
    console.error("Razorpay order error:", error);
    const message = error instanceof Error ? error.message : "Order creation failed";
    const isClientError = /cart|invalid|closed|stock|match|too many/i.test(message);
    return NextResponse.json({ success: false, error: message }, { status: isClientError ? 400 : 500 });
  }
}
