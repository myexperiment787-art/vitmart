import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { formatOrderDate, postOrderToSheet } from "../../googleSheetHelper";
import { ensureSeedUsers, findUserByPhone } from "@/src/lib/auth";
import { createOrder } from "@/src/lib/orders";
import { validateOrderAvailability } from "@/src/lib/orderAvailability";
import { calculateOrderPricing } from "@/src/lib/orderPricing";

type CartItem = {
  name: string;
  quantity: number;
  price: number;
};

type VerifyOrderPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  cartItems?: CartItem[];
  total?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  restaurantName?: string;
  restaurantId?: number;
};

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
      total,
      customerName,
      customerPhone,
      customerAddress,
      restaurantName,
      restaurantId,
    } = (await req.json()) as VerifyOrderPayload;

    const pricing = calculateOrderPricing(cartItems, restaurantId, total);
    await validateOrderAvailability(pricing);

    await ensureSeedUsers();

    let customerId: string | null = null;
    try {
      const found = customerPhone ? await findUserByPhone(customerPhone, "customer") : null;
      if (found) customerId = found.id;
    } catch (error) {
      console.warn("[order/verify] failed to lookup user by phone", error);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("[order/verify] Missing RAZORPAY_KEY_SECRET env var");
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment verification fields" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[order/verify] Signature mismatch");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: secret,
    });
    const paidOrder = (await razorpay.orders.fetch(String(razorpay_order_id))) as { amount?: number | string };
    if (Number(paidOrder.amount) !== pricing.total * 100) {
      console.error("[order/verify] Paid amount mismatch");
      return NextResponse.json({ success: false, error: "Paid amount does not match cart total" }, { status: 400 });
    }

    const ownerPhone = process.env.WHATSAPP_NUMBER || "919630741753";
    const orderItems = pricing.items.map((item) => `${item.name} x${item.quantity}`).join(", ");
    const itemsText = pricing.items
      .map((item) => `* ${item.name} x ${item.quantity} = Rs ${item.price * item.quantity}`)
      .join("\n");
    const savedRestaurantName = pricing.restaurantId ? pricing.restaurantName : restaurantName || pricing.restaurantName;

    let savedOrderId: string | null = null;
    let savedOrder: Awaited<ReturnType<typeof createOrder>> | null = null;
    try {
      const order = await createOrder({
        id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        customerId,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        customerAddress: customerAddress || null,
        items: orderItems,
        itemAmount: pricing.itemAmount,
        total: pricing.total,
        paymentId: razorpay_payment_id,
        timestamp: Date.now(),
        restaurantName: savedRestaurantName,
        restaurantId: pricing.restaurantId,
        status: "pending",
      });
      savedOrderId = order.id;
      savedOrder = order;
      console.log("Order saved to owner dashboard", savedOrderId);
    } catch (error) {
      console.error("Failed to save to owner dashboard:", error);
    }

    if (pricing.restaurantId > 0) {
      await postOrderToSheet(pricing.restaurantId, {
        orderDate: formatOrderDate(savedOrder?.timestamp ?? Date.now()),
        customerName: customerName || "Not provided",
        items: orderItems,
        deliveryAddress: customerAddress || "Not provided",
        totalAmount: pricing.total,
        orderId: savedOrderId || undefined,
      });
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const telegramMessage =
      `New Order - Quick Mart\n\n` +
      `Customer: ${customerName || "Not provided"}\n` +
      `Phone: +91 ${customerPhone || "Not provided"}\n\n` +
      `Order:\n${itemsText}\n\n` +
      `Total Paid: Rs ${pricing.total}\n` +
      `Payment ID: ${razorpay_payment_id}\n\n` +
      `PAYMENT CONFIRMED`;

    let telegramSent = false;
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            customerPhone,
            items: orderItems,
            total: pricing.total,
            paymentId: razorpay_payment_id,
          }),
        });
        console.log("Order saved to Google Sheets");
      } catch (error) {
        console.error("Google Sheets error:", error);
      }
    }

    if (telegramToken && telegramChatId && pricing.restaurantId === 0) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: telegramMessage,
          }),
        });
        const tgData = await tgRes.json();
        telegramSent = Boolean(tgData.ok);
        console.log("Telegram notification sent:", telegramSent);
      } catch (error) {
        console.error("Telegram error:", error);
      }
    }

    const cleanPhone = customerPhone?.replace(/[\s\-+]/g, "") || "";
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const customerMessage =
      `Order Confirmed! Thank you, ${customerName || "friend"}!\n\n` +
      `Your order at Quick Mart is confirmed.\n\n` +
      `Your Order:\n${itemsText}\n\n` +
      `Total Paid: Rs ${pricing.total}\n` +
      `Delivery to your hostel shortly!\n\n` +
      `For help: +91 ${ownerPhone.replace(/^91/, "")}`;
    const customerWhatsappUrl = customerPhone
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(customerMessage)}`
      : null;

    const ownerWaMessage =
      `New Order - Quick Mart\n\n` +
      `${customerName || "Unknown"}\n` +
      `+91 ${customerPhone || "N/A"}\n\n` +
      `${itemsText}\n\n` +
      `Total: Rs ${pricing.total} PAID\n` +
      `${razorpay_payment_id}`;
    const ownerWhatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(ownerWaMessage)}`;

    return NextResponse.json({
      success: true,
      telegramSent,
      ownerWhatsappUrl,
      customerWhatsappUrl,
      paymentId: razorpay_payment_id,
      savedOrderId,
      savedOrder,
    });
  } catch (error: unknown) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 }
    );
  }
}
