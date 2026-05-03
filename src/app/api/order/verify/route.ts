import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    } = await req.json();

    // ✅ Step 1: Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const ownerPhone = process.env.WHATSAPP_NUMBER || "919630741753";

    const itemsText = cartItems
      .map((item: { name: string; quantity: number; price: number }) =>
        `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`
      )
      .join("\n");

    // ✅ Step 2: Auto-send to YOUR Telegram (100% automatic, no click needed)
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
    if (telegramToken && telegramChatId) {
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
    });

  } catch (error: any) {
    console.error("❌ Verify error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}