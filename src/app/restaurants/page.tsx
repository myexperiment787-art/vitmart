"use client";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { useCart } from "../../context/CartContext";
import { getCustomerSession, logout as logoutSession } from "../../lib/customerAuthClient";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// ============================================================
// 🍽️ ADD YOUR RESTAURANTS & MENU ITEMS HERE
// ============================================================
const restaurants = [
  {
    id: 1,
    name: "Momo House",
    description: "Best momos in campus!",
    emoji: "🥟",
    rating: "4.5",
    time: "15-20 mins",
    tag: "Bestseller",
    tagColor: "#f5576c",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#667eea",
    image: "/food/vegmomo.jpg",
    menu: [
      { name: "Veg Momo (8 pcs)", price: 1, desc: "Steamed dumplings with fresh veggies", available: true },
      { name: "Fried Momo (8 pcs)", price: 70, desc: "Crispy fried momos with spicy chutney", available: true },
      { name: "Paneer Momo (8 pcs)", price: 80, desc: "Juicy momos stuffed with spiced paneer", available: true },
      { name: "Tandoori Momo (8 pcs)", price: 90, desc: "Grilled momos with tandoori spices", available: true },
      { name: "Momo Soup", price: 50, desc: "Hot momo soup with veggies", available: true },
    ],
  },
  {
    id: 2,
    name: "Chinese Corner",
    description: "Authentic Chinese street food",
    emoji: "🍜",
    rating: "4.3",
    time: "10-15 mins",
    tag: "Popular",
    tagColor: "#ff9a56",
    gradient: "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)",
    color: "#ff9a56",
    image: "/food/chowmein.jpg",
    menu: [
      { name: "Chowmein (Half)", price: 30, desc: "Stir fried noodles with veggies", available: true },
      { name: "Chowmein (Full)", price: 50, desc: "Stir fried noodles with veggies", available: true },
      { name: "Manchurian (Half)", price: 30, desc: "Crispy balls in spicy sauce (6 pcs)", available: true },
      { name: "Manchurian (Full)", price: 50, desc: "Crispy balls in spicy sauce (12 pcs)", available: true },
      { name: "Fried Rice", price: 50, desc: "Chinese style fried rice", available: true },
      { name: "Spring Roll (2 pcs)", price: 40, desc: "Crispy rolls stuffed with veggies", available: true },
    ],
  },
  {
    id: 3,
    name: "Snack Attack",
    description: "Quick bites & street snacks",
    emoji: "🍟",
    rating: "4.2",
    time: "10-15 mins",
    tag: "New 🆕",
    tagColor: "#43e97b",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "#43e97b",
    image: "/food/frenchfries.jpg",
    menu: [
      { name: "French Fries (Half)", price: 20, desc: "Golden crispy fries", available: true },
      { name: "French Fries (Full)", price: 40, desc: "Golden crispy fries", available: true },
      { name: "Chilli Potato (Half)", price: 30, desc: "Spicy crispy potatoes", available: true },
      { name: "Chilli Potato (Full)", price: 50, desc: "Spicy crispy potatoes", available: true },
      { name: "Pani Puri (6 pcs)", price: 30, desc: "Crispy puris with tangy water", available: true },
      { name: "Chaat Papdi", price: 40, desc: "Crunchy papdi with yogurt & chutneys", available: true },
      { name: "Samosa (2 pcs)", price: 25, desc: "Crispy pastry with spiced potatoes", available: true },
      { name: "Aloo Tikki (2 pcs)", price: 35, desc: "Golden potato patties", available: true },
    ],
  },
  {
    id: 4,
    name: "Fresh Bites",
    description: "Healthy & fresh food options",
    emoji: "🥗",
    rating: "4.4",
    time: "15-20 mins",
    tag: "Healthy",
    tagColor: "#4facfe",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "#4facfe",
    image: "/fruits/apple.jpg",
    menu: [
      { name: "Fruit Bowl", price: 60, desc: "Mix of seasonal fresh fruits", available: true },
      { name: "Bhel Puri", price: 35, desc: "Puffed rice with veggies & chutneys", available: true },
      { name: "Dahi Puri (6 pcs)", price: 50, desc: "Puris with yogurt & chutneys", available: true },
      { name: "Veg Sandwich", price: 40, desc: "Fresh veggies in toasted bread", available: true },
      { name: "Corn Cup", price: 30, desc: "Spiced sweet corn in a cup", available: true },
    ],
  },
];

type CartItem = { name: string; price: number; image: string; quantity: number };

const pageShellStyle: React.CSSProperties = {
  maxWidth: "1320px",
  margin: "0 auto",
  padding: "34px 22px 56px",
  fontFamily: "'Segoe UI', Poppins, -apple-system, BlinkMacSystemFont, sans-serif",
};

const cardBaseStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "22px",
  border: "1px solid #eceef4",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
};

export default function RestaurantsPage() {
  const { getCart, addToCart, increaseQty, decreaseQty, clearCart } = useCart();
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ total: number; customerName: string } | null>(null);
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [loggedCustomerId, setLoggedCustomerId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState<boolean | null>(null);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    getCustomerSession().then((session) => {
      if (session?.id) {
        setIsCustomerLoggedIn(true);
        setLoggedCustomerId(session.id);
        setCustomerName(session.name || "");
        setCustomerPhone(session.phone || "");
        return;
      }

      setIsCustomerLoggedIn(false);
      setLoggedCustomerId(null);
    });
  }, []);

  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const res = await fetch("/api/shop-status", { cache: "no-store" });
        const data = await res.json();
        setShopOpen(data.status !== "CLOSED");
      } catch {
        setShopOpen(true);
      }
    };

    checkShopStatus();
    const interval = setInterval(checkShopStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkStockStatus = async () => {
      if (!selectedRestaurant) {
        setOutOfStockItems([]);
        return;
      }

      try {
        const res = await fetch(`/api/stock-status?restaurantId=${selectedRestaurant.id}`, { cache: "no-store" });
        const data = await res.json();
        setOutOfStockItems(Array.isArray(data.outOfStockItems) ? data.outOfStockItems : []);
      } catch {
        setOutOfStockItems([]);
      }
    };

    checkStockStatus();
    const interval = setInterval(checkStockStatus, 5000);
    return () => clearInterval(interval);
  }, [selectedRestaurant]);

  const cartCategory = selectedRestaurant ? `restaurant-${selectedRestaurant.id}` : null;
  const cart = cartCategory ? getCart(cartCategory) : [];

  const restaurantCartTotal = (id: number) => {
    const list = getCart(`restaurant-${id}`);
    return list.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleAdd = (name: string, price: number, emoji: string) => {
    if (!cartCategory) return;
    addToCart({ name, price, image: emoji }, cartCategory);
    setAdded(name);
    setTimeout(() => setAdded(null), 1200);
  };

  const getQty = (name: string) => cart.find((i) => i.name === name)?.quantity || 0;
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subTotal >= 200 ? 0 : 20;
  const total = subTotal + delivery;

  const isMenuItemAvailable = (itemName: string, fallbackAvailable = true) => {
    return fallbackAvailable && !outOfStockItems.includes(itemName);
  };

  const allRestaurantItems = useMemo(
    () => restaurants.reduce((count, r) => count + restaurantCartTotal(r.id), 0),
    [selectedRestaurant, getCart]
  );

  const cartBreakdown = restaurants
    .map((restaurant) => ({
      name: restaurant.name,
      count: restaurantCartTotal(restaurant.id),
    }))
    .filter((entry) => entry.count > 0);

  const cartBreakdownLabel = cartBreakdown
    .map((entry) => `${entry.name}: ${entry.count}`)
    .join(" | ");

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayment = async () => {
    if (shopOpen === false) {
      alert("🔴 Sorry! The shop is currently closed. Please check back later!");
      return;
    }

    if (!selectedRestaurant || !cartCategory) return;
    if (cart.length === 0) return alert("Your cart is empty.");
    if (!isCustomerLoggedIn || !loggedCustomerId) {
      alert("Please login or sign up before placing order.");
      window.location.href = "/customer/login?next=/restaurants";
      return;
    }
    if (!customerName.trim()) return alert("Please enter your name.");
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      return alert("Please enter a valid 10-digit phone number.");
    }
    if (!customerAddress.trim()) return alert("Please enter your delivery address.");

    try {
      setPayLoading(true);

      const orderRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          receipt: `${cartCategory}_${Date.now()}`,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: selectedRestaurant.name,
        description: `Food Order - ${selectedRestaurant.name}`,
        order_id: orderData.order.id,
        prefill: {
          name: customerName,
          contact: `91${customerPhone.replace(/\D/g, "")}`,
        },
        theme: { color: selectedRestaurant.color },
        handler: (response: any) => {
          setOrderSuccess({ total, customerName });
          setCustomerAddress("");
          setShowForm(false);

          void (async () => {
            const verifyRes = await fetch("/api/order/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                cartItems: cart,
                total,
                customerName,
                customerPhone,
                customerAddress,
                restaurantName: selectedRestaurant.name,
                restaurantId: selectedRestaurant.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
              alert("Payment verification failed. Please contact support.");
              return;
            }

            clearCart(cartCategory);
          })();
        },
        modal: {
          ondismiss: () => setPayLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error", error);
      alert("Unable to start payment. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 18px" }}>
          <div style={{ ...cardBaseStyle, maxWidth: "580px", width: "100%", padding: "42px 32px", textAlign: "center", border: "2px solid #22c55e" }}>
            <div style={{ width: "100px", height: "100px", margin: "0 auto 24px", borderRadius: "999px", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", boxShadow: "0 12px 30px rgba(34, 197, 94, 0.3)" }}>
              ✓
            </div>
            
            <h1 style={{ margin: "0 0 8px", fontSize: "36px", color: "#15803d", fontWeight: 900 }}>Payment Successful! 🎉</h1>
            <p style={{ margin: "0 0 20px", color: "#4b5563", fontSize: "16px", fontWeight: 600 }}>
              Your payment of <span style={{ color: "#15803d", fontWeight: 800 }}>₹{orderSuccess.total}</span> is confirmed.
            </p>
            
            <div style={{ background: "#ecfdf5", border: "2px solid #86efac", borderRadius: "16px", padding: "18px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "15px", color: "#166534", fontWeight: 700 }}>✅ What happens next:</p>
              <ul style={{ margin: 0, paddingLeft: "20px", textAlign: "left", color: "#166534", fontSize: "14px", fontWeight: 600, lineHeight: "1.8" }}>
                <li>Restaurant owner receives your order immediately</li>
                <li>They start preparing your food right away</li>
                <li>Order will be ready in the estimated time</li>
                <li>Collect from main gate when ready</li>
              </ul>
            </div>
            
            <div style={{ background: "#fef3c7", border: "2px solid #fcd34d", borderRadius: "16px", padding: "14px", marginBottom: "24px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#92400e", fontWeight: 700 }}>
                📞 If you have any issues, contact: +91 9117865343
              </p>
            </div>
            
            <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "14px" }}>
              Thank you <strong style={{ color: "#0f172a" }}>{orderSuccess.customerName}</strong>! Your order is in good hands.
            </p>
            
            <button
              onClick={() => setOrderSuccess(null)}
              style={{ width: "100%", border: "none", borderRadius: "12px", padding: "14px", fontWeight: 700, fontSize: "16px", color: "white", background: "linear-gradient(135deg, #2563eb, #0ea5e9)", cursor: "pointer", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(37, 99, 235, 0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              Place another order
            </button>
            <button
              onClick={() => { window.location.href = "/customer/orders"; }}
              style={{ width: "100%", border: "1px solid #2563eb", borderRadius: "12px", padding: "12px", fontWeight: 700, fontSize: "15px", color: "#1d4ed8", background: "white", cursor: "pointer", marginTop: "10px" }}
            >
              Track this order
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {shopOpen === false ? (
        <div style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", padding: "14px 18px", color: "white", textAlign: "center", fontWeight: 900 }}>
          🔴 Shop is currently closed. You can browse, but checkout is disabled until it opens again.
        </div>
      ) : null}

      {/* Floating top-right login button removed; login button will appear beside search bar */}

      {/* Banner */}
      {!selectedRestaurant && (
        <section style={{ background: "linear-gradient(120deg, #1d4ed8 0%, #0ea5e9 42%, #14b8a6 100%)", padding: "46px 22px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", top: "-100px", right: "-50px", filter: "blur(60px)" }} />
          <h1 style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "0.2px", color: "white", marginBottom: "10px", position: "relative", zIndex: 1 }}>Order from Campus Restaurants</h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.92)", fontWeight: 600, marginBottom: "20px", position: "relative", zIndex: 1 }}>Better cards, separate carts per restaurant, and secure pre-paid checkout</p>

          {/* Search Bar with Login button */}
          <div style={{ maxWidth: "760px", margin: "0 auto", position: "relative", zIndex: 1, display: "flex", gap: "12px", alignItems: "center", justifyContent: "center" }}>
            <input
              type="text"
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: "14px 18px", borderRadius: "12px", border: "none", fontSize: "15px", outline: "none", boxSizing: "border-box", boxShadow: "0 10px 24px rgba(0,0,0,0.18)" }}
            />
            {isCustomerLoggedIn ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={() => { window.location.href = "/customer/orders"; }}
                  style={{ background: "#0f766e", color: "white", padding: "10px 14px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 800 }}>
                  My Orders
                </button>
                <button onClick={async () => { await logoutSession(); window.location.href = "/restaurants"; }}
                  style={{ background: "white", color: "#0f172a", padding: "10px 12px", borderRadius: "12px", border: "2px solid #94a3b8", cursor: "pointer", fontWeight: 700 }}>
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => { window.location.href = "/customer/login?next=/restaurants"; }}
                style={{ background: "#0ea5e9", color: "white", padding: "12px 16px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 800, boxShadow: "0 8px 20px rgba(14,116,144,0.18)" }}>
                Login
              </button>
            )}
          </div>
        </section>
      )}

      <div style={pageShellStyle}>

        {/* Restaurant List */}
        {!selectedRestaurant ? (
          <>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#111827", marginBottom: "16px" }}>
              {filtered.length} Restaurants Available
            </h2>
            <p style={{ color: "#475569", marginTop: 0, marginBottom: "20px", fontSize: "14px" }}>
              {cartBreakdown.length > 0
                ? `Cart items by restaurant: ${cartBreakdownLabel}`
                : "No items added to restaurant carts yet."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "22px" }}>
              {filtered.map((restaurant) => (
                <div key={restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  style={{ ...cardBaseStyle, overflow: "hidden", cursor: "pointer", transition: "all 0.25s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 16px 34px ${restaurant.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(15, 23, 42, 0.08)"; }}>

                  {/* Restaurant Image */}
                  <div style={{ height: "170px", background: restaurant.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "68px", position: "relative", overflow: "hidden" }}>
                    <img src={restaurant.image} alt={restaurant.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />

                    {/* Tag */}
                    <span style={{ position: "absolute", top: "12px", left: "12px", background: restaurant.tagColor, color: "white", padding: "5px 11px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, zIndex: 2 }}>
                      {restaurant.tag}
                    </span>

                    {restaurantCartTotal(restaurant.id) > 0 && (
                      <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.8)", color: "white", padding: "5px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, zIndex: 2 }}>
                        {restaurantCartTotal(restaurant.id)} in cart
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "7px" }}>
                      <h3 style={{ fontSize: "21px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{restaurant.name}</h3>
                      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "999px", padding: "3px 9px", fontSize: "12px", fontWeight: 700, color: "#166534" }}>
                        ⭐ {restaurant.rating}
                      </div>
                    </div>
                    <p style={{ fontSize: "14px", color: "#475569", marginBottom: "14px" }}>{restaurant.description}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "13px", fontWeight: 600 }}>
                      <span>{restaurant.time}</span>
                      <span>{restaurant.menu.length} items</span>
                    </div>

                    <div style={{ marginTop: "14px", padding: "10px 16px", background: restaurant.gradient, borderRadius: "12px", textAlign: "center", color: "white", fontWeight: 700, fontSize: "14px" }}>
                      Open Menu
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Restaurant Menu */
          <div>
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedRestaurant(null);
                setShowForm(false);
              }}
              style={{ background: "white", border: "1px solid #cbd5e1", color: "#1e293b", padding: "10px 20px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginBottom: "20px" }}
            >
              Back to restaurants
            </button>

            {/* Restaurant Header */}
            <div style={{ background: selectedRestaurant.gradient, borderRadius: "22px", padding: "28px", marginBottom: "24px", color: "white", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "64px" }}>{selectedRestaurant.emoji}</div>
              <div>
                <h2 style={{ fontSize: "34px", fontWeight: 900, margin: "0 0 8px" }}>{selectedRestaurant.name}</h2>
                <p style={{ fontSize: "15px", opacity: 0.95, margin: "0 0 8px" }}>{selectedRestaurant.description}</p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(255,255,255,0.22)", padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 700 }}>⭐ {selectedRestaurant.rating}</span>
                  <span style={{ background: "rgba(255,255,255,0.22)", padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 700 }}>{selectedRestaurant.time}</span>
                  <span style={{ background: "rgba(255,255,255,0.22)", padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 700 }}>{selectedRestaurant.menu.length} menu items</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>

              {/* Menu Items */}
              <div style={{ flex: "1 1 520px" }}>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>Menu</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {selectedRestaurant.menu.map((item) => {
                    const qty = getQty(item.name);
                    const justAdded = added === item.name;
                    const available = isMenuItemAvailable(item.name, item.available !== false);
                    return (
                      <div key={item.name}
                        style={{ ...cardBaseStyle, padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", opacity: available ? 1 : 0.6 }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{item.name}</h4>
                          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>{item.desc}</p>
                          <span style={{ fontSize: "21px", fontWeight: 900, color: selectedRestaurant.color }}>₹{item.price}</span>
                        </div>

                        {!available ? (
                          <span style={{ background: "#ef4444", color: "white", padding: "8px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>Not available</span>
                        ) : qty > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button onClick={() => cartCategory && decreaseQty(item.name, cartCategory)} style={{ width: "32px", height: "32px", borderRadius: "999px", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ fontWeight: 800, fontSize: "16px", minWidth: "24px", textAlign: "center" }}>{qty}</span>
                            <button onClick={() => cartCategory && increaseQty(item.name, cartCategory)} style={{ width: "32px", height: "32px", borderRadius: "999px", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => handleAdd(item.name, item.price, selectedRestaurant.emoji)}
                            style={{ background: justAdded ? "linear-gradient(135deg, #22c55e, #14b8a6)" : selectedRestaurant.gradient, color: "white", border: "none", borderRadius: "12px", padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap", transition: "all 0.3s ease" }}>
                            {justAdded ? "Added" : "Add"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cart Sidebar */}
              <div style={{ flex: "0 0 320px", minWidth: "300px" }}>
                <div style={{ ...cardBaseStyle, padding: "20px", position: "sticky", top: "90px" }}>
                    {!isCustomerLoggedIn && (
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                        <button onClick={() => { window.location.href = "/customer/login?next=/restaurants"; }}
                          style={{ background: "#0ea5e9", color: "white", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 800 }}>
                          Login to continue
                        </button>
                      </div>
                    )}
                  <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", textAlign: "center", color: "#0f172a" }}>Your Cart</h3>
                  <p style={{ textAlign: "center", marginTop: 0, marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
                    This cart belongs only to {selectedRestaurant.name}
                  </p>

                  {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>🧾</div>
                      <p style={{ fontSize: "13px", fontWeight: 600 }}>No items yet</p>
                      <p style={{ fontSize: "12px" }}>Add dishes from the menu.</p>
                    </div>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: "8px", padding: "10px 0", borderBottom: "1px solid #eef2f7", fontSize: "13px" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                            <div style={{ color: "#64748b" }}>₹{item.price} x {item.quantity}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button onClick={() => cartCategory && decreaseQty(item.name, cartCategory)} style={{ width: "22px", height: "22px", borderRadius: "999px", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ fontWeight: 800, fontSize: "13px" }}>{item.quantity}</span>
                            <button onClick={() => cartCategory && increaseQty(item.name, cartCategory)} style={{ width: "22px", height: "22px", borderRadius: "999px", background: "#16a34a", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                          <div style={{ fontWeight: 800, color: selectedRestaurant.color, minWidth: "58px", textAlign: "right" }}>₹{item.price * item.quantity}</div>
                        </div>
                      ))}

                      <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #edf2f7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#475569", marginBottom: "6px" }}>
                          <span>Subtotal</span>
                          <span>₹{subTotal}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#475569", marginBottom: "6px" }}>
                          <span>Delivery</span>
                          <span style={{ color: delivery === 0 ? "#16a34a" : "#475569", fontWeight: 700 }}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "19px", fontWeight: 900 }}>
                          <span>Total</span>
                          <span style={{ color: selectedRestaurant.color }}>₹{total}</span>
                        </div>
                      </div>

                      {!showForm ? (
                        <button
                          onClick={() => {
                            if (!isCustomerLoggedIn) {
                              alert("Please login or sign up before placing order.");
                              window.location.href = "/customer/login?next=/restaurants";
                              return;
                            }
                            setShowForm(true);
                          }}
                          style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", color: "white", fontWeight: 800, fontSize: "15px", cursor: "pointer", background: selectedRestaurant.gradient }}
                        >
                          Pay now and place order
                        </button>
                      ) : (
                        <div style={{ marginTop: "14px" }}>
                          {!isCustomerLoggedIn ? (
                            <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "10px", padding: "10px", marginBottom: "10px" }}>
                              <p style={{ margin: 0, fontSize: "12px", color: "#9a3412", textAlign: "center", fontWeight: 700 }}>
                                Login is required before order placement.
                              </p>
                            </div>
                          ) : null}
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", marginBottom: "10px" }}>
                            <p style={{ margin: 0, fontSize: "12px", color: "#334155", textAlign: "center", fontWeight: 600 }}>
                              Payment required first. Order confirms only after successful Razorpay payment.
                            </p>
                          </div>
                          <input
                            type="text"
                            placeholder="Your full name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            style={{ width: "100%", marginBottom: "8px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 12px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                          />
                          <input
                            type="tel"
                            placeholder="Phone number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                            style={{ width: "100%", marginBottom: "8px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 12px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                          />
                          <select
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            style={{ width: "100%", marginBottom: "8px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 12px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                          >
                            <option value="">Select delivery location</option>
                            <option value="Girls Hostel Block 1">Girls Hostel Block 1</option>
                            <option value="Girls Hostel Block 2">Girls Hostel Block 2</option>
                            <option value="Boys Hostel Block 1">Boys Hostel Block 1</option>
                            <option value="Special Block">Special Block</option>
                          </select>

                          <button
                            onClick={handlePayment}
                            disabled={payLoading}
                            style={{ width: "100%", marginBottom: "8px", border: "none", borderRadius: "12px", padding: "12px", color: "white", fontWeight: 800, fontSize: "15px", cursor: payLoading ? "not-allowed" : "pointer", opacity: payLoading ? 0.65 : 1, background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
                          >
                            {payLoading ? "Processing..." : "Pay with Razorpay"}
                          </button>
                          <button
                            onClick={() => setShowForm(false)}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "9px", color: "#334155", fontWeight: 700, fontSize: "13px", cursor: "pointer", background: "white" }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div style={{ marginTop: "10px", background: "#ecfdf3", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "8px", textAlign: "center" }}>
                        <p style={{ fontSize: "12px", color: "#166534", fontWeight: 700, margin: 0 }}>
                          100% prepaid checkout enabled.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating cart indicator */}
      {allRestaurantItems > 0 && !selectedRestaurant && (
        <div style={{ position: "fixed", bottom: "22px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #1d4ed8, #0891b2)", color: "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 12px 26px rgba(14, 116, 144, 0.4)", zIndex: 1000, display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 800 }}>
          {cartBreakdownLabel}
        </div>
      )}
    </>
  );
}