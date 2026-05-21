"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { usePathname } from "next/navigation";

export default function FloatingCart() {
  const { getCart, increaseQty, decreaseQty } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide on pages that already provide their own cart/checkout UI
  if (pathname === "/food" || pathname === "/restaurants") return null;

  // choose cart category based on pathname
  const category = pathname && pathname.startsWith("/fruits") ? "fruits" : "default";
  const cart = getCart(category);

  // ❌ Hide if cart is empty
  if (cart.length === 0) return null;

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subTotal >= 199 ? 0 : 20;
  const total = subTotal + delivery;

  const handleCheckout = () => {
    const phoneNumber = "919630741753";
    const itemsText = cart.map((item) => `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`).join("\n");
    const message = `🛒 *New Order from Quick Mart*\n\n${itemsText}\n\nSubtotal: ₹${subTotal}\nDelivery: ${delivery === 0 ? "FREE" : `₹${delivery}`}\nTotal: ₹${total}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      {/* Cart Icon Button */}
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 2147483647 }}>
        <button onClick={() => setOpen(!open)}
          style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#059669", color: "#fff", fontSize: "28px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)", border: "none", cursor: "pointer", position: "relative" }}>
          🛒
          <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", borderRadius: "50%", width: "24px", height: "24px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </button>
      </div>

      {/* Cart Panel */}
      {open && (
        <div style={{ position: "fixed", top: "100px", right: "16px", zIndex: 2147483647, width: "320px", background: "#fff", padding: "16px", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
          <h3 style={{ textAlign: "center", fontWeight: "bold" }}>🛒 Your Cart</h3>

          {cart.map((item) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", alignItems: "center" }}>
                <span>{item.name}</span>
                <div>
                  <button onClick={() => decreaseQty(item.name, category)}>-</button>
                  <span style={{ margin: "0 8px" }}>{item.quantity}</span>
                  <button onClick={() => increaseQty(item.name, category)}>+</button>
                </div>
              </div>
          ))}

          <hr style={{ margin: "12px 0" }} />
          <p>Subtotal: ₹{subTotal}</p>
          <p>Delivery: {delivery === 0 ? "FREE" : `₹${delivery}`}</p>
          <p style={{ fontWeight: "bold" }}>Total: ₹{total}</p>

          <button onClick={handleCheckout}
            style={{ marginTop: "16px", width: "100%", background: "#16a34a", color: "#fff", padding: "10px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
            ✅ Checkout on WhatsApp
          </button>
        </div>
      )}
    </>
  );
}