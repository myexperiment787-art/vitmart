"use client";
import Navbar from "../../../components/Navbar";
import Link from "next/link";

const restaurants = [
  {
    id: 1,
    name: "Momo House",
    emoji: "🥟",
    color: "#667eea",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: 2,
    name: "Chinese Corner",
    emoji: "🍜",
    color: "#ff9a56",
    gradient: "linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)",
  },
  {
    id: 3,
    name: "Snack Attack",
    emoji: "🍟",
    color: "#43e97b",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    id: 4,
    name: "Fresh Bites",
    emoji: "🥗",
    color: "#4facfe",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
];

export default function OwnerLoginPage() {
  return (
    <>
      <Navbar />

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#0f172a", marginBottom: "12px" }}>
              🏪 Restaurant Owner Dashboard
            </h1>
            <p style={{ fontSize: "16px", color: "#475569", marginBottom: "0px" }}>
              Select your restaurant to manage orders
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
              <Link href="/owner/order-history" style={{ display: "inline-block", textDecoration: "none", background: "#2563eb", color: "white", padding: "11px 16px", borderRadius: "12px", fontWeight: 800, fontSize: "14px" }}>
                View order history
              </Link>
              <Link href="/owner/accounts" style={{ display: "inline-block", textDecoration: "none", background: "#0f766e", color: "white", padding: "11px 16px", borderRadius: "12px", fontWeight: 800, fontSize: "14px" }}>
                View account counts
              </Link>
            </div>
          </div>

          {/* Restaurant Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/owner/orders/${restaurant.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "white",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
                    border: "1px solid #eceef4",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = `0 20px 40px ${restaurant.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 28px rgba(15, 23, 42, 0.08)";
                  }}
                >
                  {/* Image/Header */}
                  <div
                    style={{
                      height: "200px",
                      background: restaurant.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "72px",
                    }}
                  >
                    {restaurant.emoji}
                  </div>

                  {/* Content */}
                  <div style={{ padding: "24px", textAlign: "center" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                      {restaurant.name}
                    </h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                      Click to access your order dashboard
                    </p>

                    <div
                      style={{
                        background: restaurant.gradient,
                        color: "white",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "15px",
                        textAlign: "center",
                        display: "block",
                      }}
                    >
                      Open Dashboard →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "2px solid #86efac",
              borderRadius: "16px",
              padding: "20px",
              marginTop: "48px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0", fontSize: "14px", color: "#166534", fontWeight: 700 }}>
              ℹ️ Each restaurant owner only sees their own orders. No one can access other restaurants&apos; data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
