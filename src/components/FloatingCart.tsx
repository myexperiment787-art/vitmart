"use client";

import { useCart } from "../context/CartContext";

export default function FloatingCart() {
  const { cart, increaseQty, decreaseQty } = useCart();

  if (cart.length === 0) return null;

  // 🧮 SUBTOTAL
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🚚 DELIVERY LOGIC
  const deliveryCharge = totalPrice < 199 ? 20 : 0;
  const grandTotal = totalPrice + deliveryCharge;

  // 📲 WhatsApp Checkout
  const handleCheckout = () => {
    const phoneNumber = "919117865343"; // 🔴 replace if needed

    const itemsText = cart
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`
      )
      .join("\n");

    const message = `
  *New Order from VitMart*

${itemsText}

  Subtotal: ₹${totalPrice}
  Delivery: ${deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
  *Grand Total: ₹${grandTotal}*

📍 THIS IS THE DELEVERY ADDRESS.
    `;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "16px",
        zIndex: 99999,
      }}
      className="bg-white shadow-2xl rounded-xl p-4 w-64 border"
    >
      <h3 className="font-bold mb-3 text-center">🛒 Your Cart</h3>

      {cart.map((item) => (
        <div
          key={item.name}
          className="flex justify-between items-center mb-3"
        >
          <span className="text-sm font-medium">{item.name}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => decreaseQty(item.name)}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              −
            </button>

            <span className="text-sm">{item.quantity}</span>

            <button
              onClick={() => increaseQty(item.name)}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* 🧾 BILL SUMMARY */}
      <div className="border-t pt-3 mt-3 text-sm">
        <div className="flex justify-between mb-1">
          <span>Subtotal</span>
          <span>₹{totalPrice}</span>
        </div>

        <div className="flex justify-between mb-1">
          <span>Delivery</span>
          <span>
            {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
          </span>
        </div>

        <div className="flex justify-between font-semibold mt-2">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>

        {deliveryCharge > 0 && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Add ₹{199 - totalPrice} more for FREE delivery 🚚
          </p>
        )}
      </div>

      {/* ✅ CHECKOUT BUTTON */}
      <button
        onClick={handleCheckout}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
      >
        ✅ Checkout on WhatsApp
      </button>
    </div>
  );
}
