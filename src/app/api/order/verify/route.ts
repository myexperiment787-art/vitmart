import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, total } = await req.json();

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const phone = process.env.WHATSAPP_NUMBER || "919630741753";
    const itemsText = cartItems
      .map((item: { name: string; quantity: number; price: number }) => `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`)
      .join("\n");

    const message = `🎉 *New Paid Order — VitMart*\n\n💳 Payment ID: ${razorpay_payment_id}\n📦 Order ID: ${razorpay_order_id}\n\n${itemsText}\n\n💰 *Total Paid: ₹${total}*\n✅ Payment: CONFIRMED`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ success: true, whatsappUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}