"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";

export default function FloatingCart() {
  const { cart, increaseQty, decreaseQty } = useCart();
  const [open, setOpen] = useState(false);

  // 🔥 AUTO OPEN CART WHEN FIRST ITEM IS ADDED
  useEffect(() => {
    if (cart.length > 0) {
      setOpen(true);
    }
  }, [cart.length]);

  // ❌ HIDE COMPLETELY IF CART IS EMPTY
  if (cart.length === 0) return null;

  // 🧮 PRICE CALCULATION
  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const delivery = subTotal >= 199 ? 0 : 20;
  const total = subTotal + delivery;

  // 📲 WHATSAPP CHECKOUT
  const handleCheckout = () => {
    const phoneNumber = "919117865343"; // change if needed

    const itemsText = cart
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} = ₹${
            item.price * item.quantity
          }`
      )
      .join("\n");

    const message = `
🛒 *New Order from VitMart*

${itemsText}

Subtotal: ₹${subTotal}
Delivery: ${delivery === 0 ? "FREE" : `₹${delivery}`}
Total: ₹${total}
`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  };

  return (
    <>
      {/* 🛒 CART ICON */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 2147483647,
        }}
      >
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#059669",
            color: "#fff",
            fontSize: "28px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            border: "none",
            cursor: "pointer",
          }}
        >
          🛒
        </button>
      </div>

      {/* 📦 CART PANEL */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: "100px",
            right: "16px",
            zIndex: 2147483647,
            width: "320px",
            background: "#fff",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          <h3 style={{ textAlign: "center", fontWeight: "bold" }}>
            🛒 Your Cart
          </h3>

          {cart.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
                alignItems: "center",
              }}
            >
              <span>{item.name}</span>
              <div>
                <button onClick={() => decreaseQty(item.name)}>-</button>
                <span style={{ margin: "0 8px" }}>{item.quantity}</span>
                <button onClick={() => increaseQty(item.name)}>+</button>
              </div>
            </div>
          ))}

          <hr style={{ margin: "12px 0" }} />

          <p>Subtotal: ₹{subTotal}</p>
          <p>Delivery: {delivery === 0 ? "FREE" : `₹${delivery}`}</p>
          <p style={{ fontWeight: "bold" }}>Total: ₹{total}</p>

          <button
            onClick={handleCheckout}
            style={{
              marginTop: "16px",
              width: "100%",
              background: "#16a34a",
              color: "#fff",
              padding: "10px",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✅ Checkout on WhatsApp
          </button>
        </div>
      )}
    </>
  );
}
