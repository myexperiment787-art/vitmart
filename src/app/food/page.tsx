"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useCart } from "../../context/CartContext";

declare global { interface Window { Razorpay: any; } }

// Items with single price
const singleItems = [
  { name: "Pani Puri (6 pcs)", price: 20, image: "/food/panipuri.jpg", desc: "Crispy puris with spicy tangy water, potatoes & chickpeas", tag: "Bestseller", tagColor: "#f5576c", available: true },
  { name: "Spring Roll", price: 60, image: "/food/springroll.jpg", desc: "Crispy rolls stuffed with veggies & spices", tag: null, tagColor: "", available: true },
];

// Items with half & full price
const halfFullItems = [
  { name: "Veg Momo", halfPrice: 50, fullPrice: 80, halfDesc: "6 pcs", fullDesc: "12 pcs", image: "/food/vegmomo.jpg", desc: "Steamed dumplings stuffed with fresh vegetables & spices", tag: "Popular", tagColor: "#f5576c", available: true },
  { name: "Fried Momo", halfPrice: 50, fullPrice: 80, halfDesc: "6 pcs", fullDesc: "12 pcs", image: "/food/friedmomo.jpg", desc: "Crispy fried dumplings served with spicy chutney", tag: "Popular", tagColor: "#f5576c", available: true },
  { name: "Paneer Momo", halfPrice: 60, fullPrice: 90, halfDesc: "6 pcs", fullDesc: "12 pcs", image: "/food/pannermomo.jpg", desc: "Juicy momos stuffed with spiced paneer filling", tag: "Popular", tagColor: "#f5576c", available: true },
  { name: "Chilli Potato", halfPrice: 50, fullPrice: 80, halfDesc: "Half", fullDesc: "Full", image: "/food/chillipotato.jpg", desc: "Crispy potatoes tossed in spicy chilli sauce", tag: "Spicy 🌶️", tagColor: "#ff6b35", available: true },
  { name: "French Fries", halfPrice: 30, fullPrice: 50, halfDesc: "Half", fullDesc: "Full", image: "/food/frenchfries.jpg", desc: "Golden crispy fries served with ketchup", tag: "Bestseller", tagColor: "#43e97b", available: true },
  { name: "Chowmein", halfPrice: 50, fullPrice: 70, halfDesc: "Half", fullDesc: "Full", image: "/food/chowmein.jpg", desc: "Stir fried noodles with veggies & sauces", tag: null, tagColor: "", available: true },
  { name: "Manchurian", halfPrice: 50, fullPrice: 70, halfDesc: "6 pcs", fullDesc: "12 pcs", image: "/food/manchurian.jpg", desc: "Crispy veg balls in spicy manchurian sauce", tag: "Popular", tagColor: "#f5576c", available: true },
];

export default function FoodPage() {
  const { getCart, addToCart, increaseQty, decreaseQty, clearCart } = useCart();
  const cart = getCart("food");
  const [added, setAdded] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [shopOpen, setShopOpen] = useState<boolean | null>(null);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);

  // Check if an item is available
  const isItemAvailable = (itemName: string) => {
    return !outOfStockItems.includes(itemName);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // ✅ Check shop open/closed from our own API route
  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const res = await fetch("/api/shop-status", { cache: "no-store" });
        const data = await res.json();
        setShopOpen(data.status === "OPEN");
      } catch {
        setShopOpen(true);
      }
    };
    checkShopStatus();
    const interval = setInterval(checkShopStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Check stock/out-of-stock items from our API route
  useEffect(() => {
    const checkStockStatus = async () => {
      try {
        const res = await fetch("/api/stock-status", { cache: "no-store" });
        const data = await res.json();
        const outOfStock = data.outOfStockItems || [];
        console.log("Out of stock items:", outOfStock);
        setOutOfStockItems(outOfStock);
      } catch (error) {
        console.error("Stock status fetch error:", error);
        setOutOfStockItems([]);
      }
    };
    checkStockStatus();
    const interval = setInterval(checkStockStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = (name: string, price: number, image: string) => {
    if (!isItemAvailable(name)) {
      alert(`❌ ${name} is currently out of stock!`);
      return;
    }
    addToCart({ name, price, image }, "food");
    setAdded(name);
    setTimeout(() => setAdded(null), 1200);
  };

  const getQty = (name: string) => cart.find((i) => i.name === name)?.quantity || 0;
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subTotal >= 70 ? 0 : 10;
  const total = subTotal + delivery;

  const handleCheckout = async () => {
    // 🔴 Check if shop is closed
    if (shopOpen === false) {
      alert("🔴 Sorry! The shop is currently closed.\n\nPlease check back later!");
      return;
    }

    // ⏰ Only allow orders between 10 AM and 6 PM
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12 || hours >= 18) {
      alert("⏰ Sorry! Orders are only accepted between 12:00 PM - 6:00 PM.\n\nPlease come back during order hours!");
      return;
    }

    if (cart.length === 0) return alert("Your cart is empty!");
    if (!customerName.trim()) return alert("Please enter your name!");
    if (!customerPhone.trim() || customerPhone.length < 10) return alert("Please enter a valid 10-digit phone number!");
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
        prefill: { name: customerName, contact: `91${customerPhone}` },
        theme: { color: "#ff9a56" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/order/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, cartItems: cart, total, customerName, customerPhone }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setOrderSuccess({ telegramSent: verifyData.telegramSent, ownerWhatsappUrl: verifyData.ownerWhatsappUrl, customerWhatsappUrl: verifyData.customerWhatsappUrl, customerPhone, customerName, total });
            clearCart("food"); setCustomerName(""); setCustomerPhone(""); setShowForm(false);
          } else { alert("⚠️ Payment verification failed."); }
        },
        modal: { ondismiss: () => setPayLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { console.error(err); alert("Something went wrong."); }
    finally { setPayLoading(false); }
  };

  // SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "#f8f9fa" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "48px 40px", maxWidth: "500px", width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
            <div style={{ width: "90px", height: "90px", background: "linear-gradient(135deg, #43e97b, #38f9d7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", margin: "0 auto 24px" }}>✅</div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#2d3436", marginBottom: "8px" }}>Payment Successful!</h2>
            <p style={{ fontSize: "16px", color: "#636e72", marginBottom: "4px" }}>Total Paid: <strong style={{ color: "#ff6b35" }}>₹{orderSuccess.total}</strong></p>
            <p style={{ fontSize: "14px", color: "#636e72", marginBottom: "28px" }}>Thank you, <strong>{orderSuccess.customerName}</strong>! 🎉</p>
            {orderSuccess.telegramSent ? (
              <div style={{ background: "#f0fff4", border: "2px solid #43e97b", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
                <p style={{ fontSize: "15px", color: "#276749", fontWeight: "800", margin: 0 }}>Owner no:- 6263062688</p>
              </div>
            ) : (
              <div style={{ marginBottom: "16px" }}>
                <a href={orderSuccess.ownerWhatsappUrl} target="_blank" rel="noreferrer" style={{ display: "block", background: "linear-gradient(135deg, #25D366, #128C7E)", color: "white", padding: "14px", borderRadius: "50px", fontWeight: "800", fontSize: "15px", textDecoration: "none" }}>
                  📲 Send Order to My WhatsApp
                </a>
              </div>
            )}
            <button onClick={() => setOrderSuccess(null)} style={{ background: "linear-gradient(135deg, #ff9a56, #ff6b35)", color: "white", border: "none", borderRadius: "50px", padding: "14px 32px", fontWeight: "800", fontSize: "16px", cursor: "pointer", width: "100%" }}>
              🍽️ Order More Food
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* 🔴 SHOP CLOSED BANNER */}
      {shopOpen === false && (
        <div style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", padding: "20px 24px", textAlign: "center", position: "relative", zIndex: 100 }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <p style={{ color: "white", fontSize: "22px", fontWeight: "900", margin: "0 0 6px" }}>🔴 Shop is Currently Closed</p>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "15px", fontWeight: "600", margin: 0 }}>We are not accepting orders right now. Please check back later!</p>
          </div>
        </div>
      )}

      {/* 📦 OUT OF STOCK BANNER */}
      {outOfStockItems.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", padding: "16px 24px", textAlign: "center", position: "relative", zIndex: 99 }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <p style={{ color: "white", fontSize: "16px", fontWeight: "900", margin: "0 0 8px" }}>📦 Out of Stock Today:</p>
            <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "14px", fontWeight: "600", margin: 0 }}>
              {outOfStockItems.join(", ")}
            </p>
          </div>
        </div>
      )}
      <section style={{ background: "linear-gradient(135deg, #ff9a56 0%, #ff6b35 50%, #ffeaa7 100%)", padding: "60px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", top: "-150px", right: "-100px", filter: "blur(60px)" }} />
        <h1 style={{ fontSize: "52px", fontWeight: "900", color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.2)", marginBottom: "12px", position: "relative", zIndex: 1 }}>🍽️ Street Food & Snacks</h1>
        <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.95)", fontWeight: "600", position: "relative", zIndex: 1, maxWidth: "600px", margin: "0 auto 20px" }}>Fresh, tasty & delivered to your hostel</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>

  <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "10px 24px", borderRadius: "50px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
    <span style={{ color: "white", fontWeight: "700" }}>Order Timing 12:00 AM - 6:00 PM</span>
  </div>

  <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "10px 24px", borderRadius: "50px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
    <span style={{ color: "white", fontWeight: "1000" }}>Please collect your order within 15 minutes near main gate</span>
  </div>

  <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "10px 24px", borderRadius: "50px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
    <span style={{ color: "white", fontWeight: "700" }}>🚚 Free delivery on orders above ₹70</span>
  </div>

</div>
        </div>
      </section>

      <div style={{ display: "flex", gap: "32px", padding: "48px 40px", maxWidth: "1400px", margin: "0 auto", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Food Grid */}
        <div style={{ flex: "1 1 600px" }}>

          {/* ── Half / Full Items ── */}
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#2d3436", marginBottom: "20px" }}>🍜 Half & Full Available</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            {halfFullItems.map((item) => {
              const available = isItemAvailable(item.name);
              return (
              <div key={item.name}
                style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", opacity: available ? 1 : 0.6, transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                onMouseEnter={(e) => { if (available) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(255,154,86,0.25)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}>

                {/* Image */}
                <div style={{ height: "160px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)" }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {item.tag && <span style={{ position: "absolute", top: "10px", left: "10px", background: item.tagColor, color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{item.tag}</span>}
                  {!available && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "#ef4444", color: "white", padding: "8px 20px", borderRadius: "50px", fontSize: "14px", fontWeight: "800" }}>❌ Not Available</span></div>}
                </div>

                <div style={{ padding: "16px" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#2d3436", marginBottom: "4px" }}>{item.name}</h3>
                  <p style={{ fontSize: "12px", color: "#636e72", lineHeight: "1.5", marginBottom: "14px" }}>{item.desc}</p>

                  {/* Half / Full buttons */}
                  {available ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      {/* HALF */}
                      <div style={{ flex: 1, background: "#fff8f0", borderRadius: "12px", padding: "10px", textAlign: "center", border: "2px solid #ffd4a8" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#ff6b35", marginBottom: "4px" }}>HALF</div>
                        <div style={{ fontSize: "13px", color: "#636e72", marginBottom: "6px" }}>{item.halfDesc}</div>
                        <div style={{ fontSize: "18px", fontWeight: "900", color: "#ff6b35", marginBottom: "8px" }}>₹{item.halfPrice}</div>
                        {getQty(`${item.name} (Half)`) > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <button onClick={() => decreaseQty(`${item.name} (Half)`, "food")} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>−</button>
                            <span style={{ fontWeight: "800", fontSize: "14px" }}>{getQty(`${item.name} (Half)`)}</span>
                            <button onClick={() => increaseQty(`${item.name} (Half)`, "food")} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => handleAdd(`${item.name} (Half)`, item.halfPrice, item.image)}
                            style={{ background: added === `${item.name} (Half)` ? "linear-gradient(135deg, #43e97b, #38f9d7)" : "linear-gradient(135deg, #ff9a56, #ff6b35)", color: "white", border: "none", borderRadius: "50px", padding: "6px 14px", fontWeight: "700", cursor: "pointer", fontSize: "12px", width: "100%" }}>
                            {added === `${item.name} (Half)` ? "✓ Added!" : "+ Add"}
                          </button>
                        )}
                      </div>

                      {/* FULL */}
                      <div style={{ flex: 1, background: "#f0fff4", borderRadius: "12px", padding: "10px", textAlign: "center", border: "2px solid #c6f6d5" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", marginBottom: "4px" }}>FULL</div>
                        <div style={{ fontSize: "13px", color: "#636e72", marginBottom: "6px" }}>{item.fullDesc}</div>
                        <div style={{ fontSize: "18px", fontWeight: "900", color: "#16a34a", marginBottom: "8px" }}>₹{item.fullPrice}</div>
                        {getQty(`${item.name} (Full)`) > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <button onClick={() => decreaseQty(`${item.name} (Full)`, "food")} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>−</button>
                            <span style={{ fontWeight: "800", fontSize: "14px" }}>{getQty(`${item.name} (Full)`)}</span>
                            <button onClick={() => increaseQty(`${item.name} (Full)`, "food")} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => handleAdd(`${item.name} (Full)`, item.fullPrice, item.image)}
                            style={{ background: added === `${item.name} (Full)` ? "linear-gradient(135deg, #43e97b, #38f9d7)" : "linear-gradient(135deg, #43e97b, #38f9d7)", color: "white", border: "none", borderRadius: "50px", padding: "6px 14px", fontWeight: "700", cursor: "pointer", fontSize: "12px", width: "100%" }}>
                            {added === `${item.name} (Full)` ? "✓ Added!" : "+ Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "10px", background: "#fff0f0", borderRadius: "10px" }}>
                      <span style={{ color: "#ef4444", fontWeight: "700", fontSize: "14px" }}>❌ Not Available Today</span>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* ── Single Price Items ── */}
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#2d3436", marginBottom: "20px" }}>🍽️ All Items</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
            {singleItems.map((item) => {
              const qty = getQty(item.name);
              const justAdded = added === item.name;
              return (
                <div key={item.name}
                  style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", opacity: isItemAvailable(item.name) ? 1 : 0.6, transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                  onMouseEnter={(e) => { if (isItemAvailable(item.name)) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(255,154,86,0.25)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}>
                  <div style={{ height: "160px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)" }}>
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {item.tag && <span style={{ position: "absolute", top: "10px", left: "10px", background: item.tagColor, color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{item.tag}</span>}
                    {!isItemAvailable(item.name) && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "#ef4444", color: "white", padding: "8px 20px", borderRadius: "50px", fontSize: "14px", fontWeight: "800" }}>❌ Not Available</span></div>}
                  </div>
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#2d3436", marginBottom: "4px" }}>{item.name}</h3>
                    <p style={{ fontSize: "12px", color: "#636e72", lineHeight: "1.5", marginBottom: "12px" }}>{item.desc}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: "900", color: "#ff6b35" }}>₹{item.price}</span>
                      {!isItemAvailable(item.name) ? (
                        <span style={{ background: "#ef4444", color: "white", padding: "6px 14px", borderRadius: "50px", fontSize: "12px", fontWeight: "700" }}>❌ Not Available</span>
                      ) : qty > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button onClick={() => decreaseQty(item.name, "food")} style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <span style={{ fontWeight: "800", minWidth: "24px", textAlign: "center", fontSize: "16px" }}>{qty}</span>
                          <button onClick={() => increaseQty(item.name, "food")} style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => handleAdd(item.name, item.price, item.image)}
                          style={{ background: justAdded ? "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" : "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)", color: "white", border: "none", borderRadius: "50px", padding: "8px 20px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
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
        <div style={{ flex: "0 0 300px", minWidth: "280px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", position: "sticky", top: "90px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "16px", textAlign: "center" }}>🛒 Order Summary</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#b2bec3" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🍽️</div>
                <p style={{ fontSize: "14px", fontWeight: "600" }}>Your cart is empty</p>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>Add items from the menu!</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0", fontSize: "14px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", color: "#2d3436", fontSize: "13px" }}>{item.name}</div>
                      <div style={{ fontSize: "12px", color: "#636e72" }}>₹{item.price} × {item.quantity}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => decreaseQty(item.name, "food")} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontWeight: "800", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => increaseQty(item.name, "food")} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <div style={{ fontWeight: "800", color: "#ff6b35", marginLeft: "12px", minWidth: "48px", textAlign: "right" }}>₹{item.price * item.quantity}</div>
                  </div>
                ))}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#636e72" }}><span>Subtotal</span><span>₹{subTotal}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#636e72" }}>
                    <span>Delivery</span>
                    <span style={{ color: delivery === 0 ? "#16a34a" : "#ff6b35", fontWeight: "700" }}>{delivery === 0 ? "🎉 FREE" : `₹${delivery}`}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "2px solid #f0f0f0", marginTop: "8px", fontSize: "20px", fontWeight: "900" }}>
                    <span>Total</span><span style={{ color: "#ff6b35" }}>₹{total}</span>
                  </div>
                </div>
                {subTotal < 70 && (
                  <div style={{ background: "#fff8f0", border: "1px solid #ffd4a8", borderRadius: "10px", padding: "10px", marginTop: "12px", textAlign: "center" }}>
                    <p style={{ fontSize: "12px", color: "#ff6b35", fontWeight: "700" }}>Add ₹{70 - subTotal} more for FREE delivery! 🚚</p>
                  </div>
                )}
                {!showForm ? (
                  (() => {
                    const h = new Date().getHours();
                    const isTimeOk = h >= 12 && h < 18;
                    const isOpen = shopOpen !== false && isTimeOk;
                    const btnMsg = shopOpen === false
                      ? "🔴 Shop is Closed"
                      : !isTimeOk
                      ? "⏰ Orders Closed (12AM - 6PM only)"
                      : "💳 Pay with Razorpay";
                    return (
                      <button
                        onClick={() => isOpen ? setShowForm(true) : alert(shopOpen === false ? "🔴 Shop is currently closed!" : "⏰ Orders accepted only between 12:00 AM - 6:00 PM!")}
                        style={{ marginTop: "16px", width: "100%", background: isOpen ? "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)" : shopOpen === false ? "#ef4444" : "#b2bec3", color: "white", border: "none", borderRadius: "50px", padding: "14px", fontWeight: "800", fontSize: "16px", cursor: isOpen ? "pointer" : "not-allowed", boxShadow: isOpen ? "0 6px 20px rgba(255,107,53,0.35)" : "none" }}>
                        {btnMsg}
                      </button>
                    );
                  })()
                ) : (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ background: "#f0fff4", border: "1px solid #c6f6d5", borderRadius: "10px", padding: "10px", marginBottom: "12px" }}>
                      <p style={{ fontSize: "12px", color: "#276749", fontWeight: "700", textAlign: "center" }}>📱 Enter details for WhatsApp confirmation</p>
                    </div>
                    <input type="text" placeholder="Your Name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "2px solid #f0f0f0", fontSize: "14px", marginBottom: "10px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#2d3436" }}
                      onFocus={(e) => { e.target.style.borderColor = "#ff9a56"; }} onBlur={(e) => { e.target.style.borderColor = "#f0f0f0"; }} />
                    <div style={{ position: "relative", marginBottom: "10px" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#636e72", fontWeight: "700", pointerEvents: "none" }}>+91</span>
                      <input type="tel" placeholder="WhatsApp Number *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        style={{ width: "100%", padding: "11px 14px 11px 46px", borderRadius: "10px", border: "2px solid #f0f0f0", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#2d3436" }}
                        onFocus={(e) => { e.target.style.borderColor = "#ff9a56"; }} onBlur={(e) => { e.target.style.borderColor = "#f0f0f0"; }} />
                    </div>
                    <button onClick={handleCheckout} disabled={payLoading}
                      style={{ width: "100%", background: payLoading ? "#ccc" : "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)", color: "white", border: "none", borderRadius: "50px", padding: "14px", fontWeight: "800", fontSize: "15px", cursor: payLoading ? "not-allowed" : "pointer", boxShadow: "0 6px 20px rgba(255,107,53,0.35)", marginBottom: "8px" }}>
                      {payLoading ? "⏳ Processing..." : `💳 Confirm & Pay ₹${total}`}
                    </button>
                    <button onClick={() => setShowForm(false)} style={{ width: "100%", background: "transparent", color: "#b2bec3", border: "1px solid #dfe6e9", borderRadius: "50px", padding: "10px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>← Back</button>
                  </div>
                )}
                <button onClick={() => clearCart("food")} style={{ marginTop: "10px", width: "100%", background: "transparent", color: "#b2bec3", border: "1px solid #dfe6e9", borderRadius: "50px", padding: "10px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>🗑️ Clear Cart</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}