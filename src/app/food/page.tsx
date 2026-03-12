"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useCart } from "../../context/CartContext";

declare global { interface Window { Razorpay: any; } }

const foodItems = [
  { name: "Pani Puri (6 pcs)", price: 30, emoji: "🫙", desc: "Crispy puris with spicy tangy water, potatoes & chickpeas", tag: "Bestseller", tagColor: "#f5576c" },
  { name: "Veg Momo (8 pcs)", price: 60, emoji: "🥟", desc: "Steamed dumplings stuffed with fresh vegetables & spices", tag: "Popular", tagColor: "#667eea" },
  { name: "Fried Momo (8 pcs)", price: 70, emoji: "🍟", desc: "Crispy fried dumplings served with spicy chutney", tag: null, tagColor: "" },
  { name: "Chaat Papdi", price: 40, emoji: "🥗", desc: "Crunchy papdi topped with yogurt, chutneys & chaat masala", tag: "Spicy 🌶️", tagColor: "#ff6b35" },
  { name: "Aloo Tikki (2 pcs)", price: 35, emoji: "🥔", desc: "Golden fried potato patties with mint & tamarind chutney", tag: null, tagColor: "" },
  { name: "Bhel Puri", price: 35, emoji: "🍱", desc: "Puffed rice mixed with veggies, chutneys & sev", tag: null, tagColor: "" },
  { name: "Samosa (2 pcs)", price: 25, emoji: "🔺", desc: "Crispy pastry filled with spiced potatoes & peas", tag: "Classic", tagColor: "#43e97b" },
  { name: "Dahi Puri (6 pcs)", price: 50, emoji: "🫧", desc: "Soft puris filled with yogurt, sev & sweet-spicy chutneys", tag: "Sweet & Spicy", tagColor: "#f093fb" },
];

export default function FoodPage() {
  const { cart, addToCart, increaseQty, decreaseQty, clearCart } = useCart();
  const [added, setAdded] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleAdd = (item: { name: string; price: number; emoji: string }) => {
    addToCart({ name: item.name, price: item.price, image: item.emoji });
    setAdded(item.name);
    setTimeout(() => setAdded(null), 1200);
  };

  const getQty = (name: string) => cart.find((i) => i.name === name)?.quantity || 0;
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subTotal >= 199 ? 0 : 20;
  const total = subTotal + delivery;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    try {
      setPayLoading(true);
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, receipt: `food_${Date.now()}` }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "VIT MART",
        description: "Food Order",
        order_id: data.order.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/order/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, cartItems: cart, total }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            window.open(verifyData.whatsappUrl, "_blank");
            clearCart();
            alert("✅ Payment successful! Order sent to WhatsApp.");
          } else {
            alert("⚠️ Payment verification failed. Contact support.");
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#ff9a56" },
        modal: { ondismiss: () => setPayLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setPayLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Banner */}
      <section style={{ background: "linear-gradient(135deg, #ff9a56 0%, #ff6b35 50%, #ffeaa7 100%)", padding: "60px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", top: "-150px", right: "-100px", filter: "blur(60px)" }} />
        <h1 style={{ fontSize: "52px", fontWeight: "900", color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.2)", marginBottom: "12px", position: "relative", zIndex: 1 }}>🍽️ Street Food & Snacks</h1>
        <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.95)", fontWeight: "600", position: "relative", zIndex: 1, maxWidth: "600px", margin: "0 auto 20px" }}>Fresh, tasty & delivered to your doorstep</p>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "10px 24px", borderRadius: "50px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", position: "relative", zIndex: 1 }}>
          <span style={{ color: "white", fontWeight: "700" }}>🚚 Free delivery on orders above ₹199</span>
        </div>
      </section>

      <div style={{ display: "flex", gap: "32px", padding: "48px 40px", maxWidth: "1400px", margin: "0 auto", flexWrap: "wrap" }}>

        {/* Food Grid */}
        <div style={{ flex: "1 1 600px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
            {foodItems.map((item) => {
              const qty = getQty(item.name);
              const justAdded = added === item.name;
              return (
                <div key={item.name}
                  style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(255,154,86,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}>
                  <div style={{ height: "130px", background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "68px", position: "relative" }}>
                    {item.emoji}
                    {item.tag && <span style={{ position: "absolute", top: "10px", left: "10px", background: item.tagColor, color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{item.tag}</span>}
                  </div>
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#2d3436", marginBottom: "4px" }}>{item.name}</h3>
                    <p style={{ fontSize: "12px", color: "#636e72", lineHeight: "1.5", marginBottom: "12px" }}>{item.desc}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: "900", color: "#ff6b35" }}>₹{item.price}</span>
                      {qty > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button onClick={() => decreaseQty(item.name)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>−</button>
                          <span style={{ fontWeight: "700", minWidth: "20px", textAlign: "center" }}>{qty}</span>
                          <button onClick={() => increaseQty(item.name)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => handleAdd(item)} style={{ background: justAdded ? "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" : "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)", color: "white", border: "none", borderRadius: "50px", padding: "8px 18px", fontWeight: "700", cursor: "pointer", fontSize: "13px", transition: "all 0.3s ease" }}>
                          {justAdded ? "✓ Added!" : "+ Add"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        {cart.length > 0 && (
          <div style={{ flex: "0 0 300px" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", position: "sticky", top: "90px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "16px", textAlign: "center" }}>🛒 Order Summary</h3>
              {cart.map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: "14px" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div style={{ marginTop: "16px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Subtotal</span><span>₹{subTotal}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Delivery</span><span style={{ color: delivery === 0 ? "#16a34a" : "inherit" }}>{delivery === 0 ? "🎉 FREE" : `₹${delivery}`}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "2px solid #f0f0f0", marginTop: "8px", fontSize: "18px", fontWeight: "800" }}>
                  <span>Total</span><span style={{ color: "#ff6b35" }}>₹{total}</span>
                </div>
              </div>
              <button onClick={handleCheckout} disabled={payLoading}
                style={{ marginTop: "16px", width: "100%", background: payLoading ? "#ccc" : "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)", color: "white", border: "none", borderRadius: "50px", padding: "14px", fontWeight: "800", fontSize: "16px", cursor: payLoading ? "not-allowed" : "pointer", boxShadow: "0 6px 20px rgba(255,107,53,0.35)" }}>
                {payLoading ? "⏳ Processing..." : "💳 Pay with Razorpay"}
              </button>
              {subTotal < 199 && <p style={{ marginTop: "10px", textAlign: "center", fontSize: "12px", color: "#636e72" }}>Add ₹{199 - subTotal} more for free delivery!</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}