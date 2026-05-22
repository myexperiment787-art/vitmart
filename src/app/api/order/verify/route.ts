import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { formatOrderDate, postOrderToSheet } from "../../googleSheetHelper";
import { ensureSeedUsers, findUserByPhone } from "@/src/lib/auth";
import { createOrder } from "@/src/lib/orders";

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
    } = await req.json();

    await ensureSeedUsers();
    // Don't require an authenticated session here because Razorpay handler may not send cookies
    // instead, try to associate the order with an existing customer by phone if possible
    let customerId: string | null = null;
    try {
      const found = customerPhone ? await findUserByPhone(customerPhone, "customer") : null;
      if (found) customerId = found.id;
    } catch (e) {
      console.warn("[order/verify] failed to lookup user by phone", e);
    }

    // ✅ Step 1: Verify Razorpay signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    console.log("[order/verify] Razorpay secret present=", Boolean(secret));
    if (!secret) {
      console.error("[order/verify] Missing RAZORPAY_KEY_SECRET env var");
      return NextResponse.json({ success: false, error: "Payment gateway not configured (missing secret)" }, { status: 500 });
    }

    const expectedSignature = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    console.log("[order/verify] expectedSignature=", expectedSignature);
    console.log("[order/verify] receivedSignature=", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error("[order/verify] Signature mismatch");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const ownerPhone = process.env.WHATSAPP_NUMBER || "919630741753";

    const itemsText = cartItems
      .map((item: { name: string; quantity: number; price: number }) =>
        `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`
      )
      .join("\n");

    const itemAmount = cartItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    // ✅ Step 2: Save order to owner dashboard
    const orderForOwner = {
      customerName,
      customerPhone,
      customerAddress,
      items: cartItems
        .map((item: any) => `${item.name} ×${item.quantity}`)
        .join(", "),
      itemAmount,
      total,
      paymentId: razorpay_payment_id,
      restaurantName: restaurantName || "Unknown Restaurant",
      restaurantId: restaurantId || 0,
    };

    let savedOrderId: string | null = null;
    let savedOrder: any = null;
    try {
      const order = await createOrder({
        id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        customerId: customerId,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        customerAddress: customerAddress || null,
        items: orderForOwner.items,
        itemAmount,
        total,
        paymentId: razorpay_payment_id,
        timestamp: Date.now(),
        restaurantName: restaurantName || "Unknown Restaurant",
        restaurantId: restaurantId || 0,
        status: "pending",
      });
      savedOrderId = order.id;
      savedOrder = order;
      console.log("✅ Order saved to owner dashboard", savedOrderId);
    } catch (e) {
      console.error("Failed to save to owner dashboard:", e);
    }

    // ✅ Step 2b: Post to restaurant-specific Google Sheet (include orderId so sheet can update instead of duplicate)
    if (restaurantId && restaurantId > 0) {
      await postOrderToSheet(restaurantId, {
        orderDate: formatOrderDate(savedOrder?.timestamp ?? Date.now()),
        customerName: customerName || "Not provided",
        items: cartItems
          .map((item: any) => `${item.name} ×${item.quantity}`)
          .join(", "),
        deliveryAddress: customerAddress || "Not provided",
        totalAmount: total,
        orderId: savedOrderId || undefined,
      });
    }

    // ✅ Step 3: Auto-send to YOUR Telegram (100% automatic, no click needed)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    const telegramMessage =
      `🔔 *New Order — Quick Mart*\n\n` +
      `👤 Customer: ${customerName || "Not provided"}\n` +
      `📱 Phone: +91 ${customerPhone || "Not provided"}\n\n` +
      `🛒 *Order:*\n${itemsText}\n\n` +
      `💰 *Total Paid: ₹${total}*\n` +
      `💳 Payment ID: \`${razorpay_payment_id}\`\n\n` +
      `✅ *PAYMENT CONFIRMED*`;

    let telegramSent = false;
    // ✅ Save to Google Sheets
const sheetUrl = process.env.GOOGLE_SHEET_URL;
if (sheetUrl) {
  try {
    const itemsText = cartItems
      .map((item: any) => `${item.name} ×${item.quantity}`)
      .join(", ");

    await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        items: itemsText,
        total,
        paymentId: razorpay_payment_id,
      }),
    });
    console.log("✅ Order saved to Google Sheets");
  } catch (e) {
    console.error("Google Sheets error:", e);
  }
}
    // Only send Telegram notification for FOOD orders, NOT restaurant orders
    if (telegramToken && telegramChatId && (!restaurantId || restaurantId === 0)) {
      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: telegramMessage,
              parse_mode: "Markdown",
            }),
          }
        );
        const tgData = await tgRes.json();
        telegramSent = tgData.ok;
        console.log("✅ Telegram notification sent:", tgData.ok);
      } catch (e) {
        console.error("Telegram error:", e);
      }
    }

    // ✅ Step 3: Build WhatsApp URL for customer confirmation
    const cleanPhone = customerPhone?.replace(/[\s\-\+]/g, "") || "";
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const customerMessage =
      `🎉 *Order Confirmed! Thank you, ${customerName || "friend"}!*\n\n` +
      `Your order at *Quick Mart* is confirmed 🛒\n\n` +
      `🛒 *Your Order:*\n${itemsText}\n\n` +
      `💰 Total Paid: ₹${total}\n` +
      `🚚 Delivery to your hostel shortly!\n\n` +
      `For help: +91 ${ownerPhone.replace(/^91/, "")}`;

    const customerWhatsappUrl = customerPhone
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(customerMessage)}`
      : null;

    // Backup WhatsApp URL for owner (in case Telegram not set up)
    const ownerWaMessage =
      `🔔 *New Order — Quick Mart*\n\n` +
      `👤 ${customerName || "Unknown"}\n` +
      `📱 +91 ${customerPhone || "N/A"}\n\n` +
      `🛒 ${itemsText}\n\n` +
      `💰 Total: ₹${total} ✅ PAID\n` +
      `💳 ${razorpay_payment_id}`;

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

  } catch (error: any) {
    console.error("❌ Verify error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}