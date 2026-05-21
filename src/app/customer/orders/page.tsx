"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";
import { getCustomerSession } from "../../../lib/customerAuthClient";
import { useRouter } from "next/navigation";

type CustomerOrder = {
  id: string;
  restaurantName: string;
  items: string;
  total: number;
  timestamp: number;
  status: string;
  driver?: string;
  customerAddress?: string;
};

function statusLabel(status: string) {
  if (status === "accepted") return "Cooking";
  if (status === "picked") return "Picked Up";
  if (status === "completed") return "Delivered";
  return "Pending";
}

function statusIcon(status: string) {
  if (status === "accepted") return "🍳";
  if (status === "picked") return "🛵";
  if (status === "completed") return "✅";
  return "⏳";
}

function statusColor(status: string) {
  if (status === "accepted") return "#0ea5e9";
  if (status === "picked") return "#2563eb";
  if (status === "completed") return "#16a34a";
  return "#f59e0b";
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const testDeliveryNumber = "9117865343";
  const cacheKey = "customer_orders_cache";

  useEffect(() => {
    const load = async () => {
      try {
        const session = await getCustomerSession();
        if (!session) {
          router.push("/customer/login?next=/customer/orders");
          return;
        }

        const res = await fetch("/api/customer/orders", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Unable to load your orders");
          return;
        }

        const nextOrders = Array.isArray(data.orders) ? data.orders : [];
        if (nextOrders.length > 0) {
          setOrders(nextOrders);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(nextOrders));
          } catch {}
        } else {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached) as CustomerOrder[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setOrders(parsed);
              } else {
                setOrders([]);
              }
            } else {
              setOrders([]);
            }
          } catch {
            setOrders([]);
          }
        }
      } catch {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as CustomerOrder[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOrders(parsed);
              setError(null);
              return;
            }
          }
        } catch {}
        setError("Unable to load your orders");
      } finally {
        setLoading(false);
      }
    };

    load();
    const id = window.setInterval(load, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "24px 18px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "40px", margin: "8px 0", color: "#0f172a", fontWeight: 900, lineHeight: 1.05 }}>My Order History</h1>
            <p style={{ color: "#475569", marginTop: 0, fontSize: "17px" }}>Track your order progress in real-time.</p>
          </div>
          <Link
            href="/restaurants"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "999px",
              padding: "12px 18px",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              color: "white",
              fontWeight: 800,
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
              whiteSpace: "nowrap",
            }}
          >
            🍽️ Back to Restaurants
          </Link>
        </div>

        {loading ? <p>Loading orders...</p> : null}
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}

        {!loading && !error && orders.length === 0 ? (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
            <p style={{ margin: 0, color: "#475569" }}>No orders yet.</p>
            <Link href="/restaurants" style={{ color: "#0e7490", fontWeight: 700 }}>Browse restaurants</Link>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: "14px" }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: `2px solid ${statusColor(order.status)}33`, borderLeft: `6px solid ${statusColor(order.status)}`, borderRadius: "14px", background: "white", padding: "18px", boxShadow: "0 8px 20px rgba(2, 6, 23, 0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>{order.restaurantName}</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>{new Date(order.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>₹{order.total}</div>
                  <div style={{ fontSize: "16px", color: statusColor(order.status), fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                    <span style={{ fontSize: "20px", lineHeight: 1 }}>{statusIcon(order.status)}</span>
                    <span>{statusLabel(order.status)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "12px", color: "#334155", fontSize: "16px", lineHeight: 1.6 }}>{order.items}</div>
              {order.customerAddress ? <div style={{ marginTop: "8px", color: "#475569", fontSize: "14px" }}>Address: {order.customerAddress}</div> : null}
              {order.status === "picked" ? (
                <div style={{ marginTop: "10px", color: "#0f172a", fontSize: "15px", fontWeight: 800, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span>Delivery boy:</span>
                  <a
                    href={`tel:${(order.driver && /\d{10,}/.test(order.driver) ? order.driver.replace(/\D/g, "") : testDeliveryNumber)}`}
                    style={{ color: "#0e7490", textDecoration: "none" }}
                  >
                    {order.driver && /\d{10,}/.test(order.driver) ? order.driver.replace(/\D/g, "") : testDeliveryNumber}
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
