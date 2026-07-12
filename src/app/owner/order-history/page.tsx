"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/src/components/Navbar";
import { mergeBrowserOrders, saveBrowserOrders, BrowserOrder } from "@/src/lib/orderBrowserCache";

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  driver?: string | null;
  items: string;
  itemAmount: number;
  total: number;
  paymentId?: string | null;
  timestamp: number;
  restaurantName: string;
  restaurantId: number;
  status: string;
};

type RestaurantSummary = {
  restaurantId: number;
  restaurantName: string;
  orderCount: number;
  totalAmount: number;
  latestTimestamp: number;
};

type DateSummary = {
  date: string;
  orderCount: number;
  totalAmount: number;
};

type Counts = {
  totalOrders: number;
  totalAmount: number;
  restaurants: number;
};

const restaurants = [
  { id: 0, name: "All restaurants" },
  { id: 1, name: "Momo House" },
  { id: 2, name: "Chinese Corner" },
  { id: 3, name: "Snack Attack" },
  { id: 4, name: "Fresh Bites" },
];

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));
}

function dateKey(timestamp: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function toBrowserOrder(order: Order): BrowserOrder {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    driver: order.driver,
    items: order.items,
    itemAmount: order.itemAmount,
    total: order.total,
    paymentId: order.paymentId,
    timestamp: order.timestamp,
    restaurantName: order.restaurantName,
    restaurantId: order.restaurantId,
    status: order.status,
  };
}

function toHistoryOrder(order: BrowserOrder): Order {
  return {
    id: String(order.id),
    customerName: String(order.customerName || ""),
    customerPhone: String(order.customerPhone || ""),
    customerAddress: order.customerAddress ?? null,
    driver: order.driver ?? null,
    items: String(order.items || ""),
    itemAmount: Number(order.itemAmount || 0),
    total: Number(order.total || 0),
    paymentId: order.paymentId ?? null,
    timestamp: Number(order.timestamp || Date.now()),
    restaurantName: String(order.restaurantName || "Unknown restaurant"),
    restaurantId: Number(order.restaurantId || 0),
    status: String(order.status || "pending"),
  };
}

function summarizeOrders(orders: Order[]) {
  const byRestaurant = Array.from(
    orders.reduce((map, order) => {
      const key = String(order.restaurantId || order.restaurantName);
      const current = map.get(key) || {
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        orderCount: 0,
        totalAmount: 0,
        latestTimestamp: 0,
      };
      current.orderCount += 1;
      current.totalAmount += Number(order.total || 0);
      current.latestTimestamp = Math.max(current.latestTimestamp, Number(order.timestamp || 0));
      map.set(key, current);
      return map;
    }, new Map<string, RestaurantSummary>())
  ).map(([, value]) => value);

  const byDate = Array.from(
    orders.reduce((map, order) => {
      const key = dateKey(order.timestamp);
      const current = map.get(key) || { date: key, orderCount: 0, totalAmount: 0 };
      current.orderCount += 1;
      current.totalAmount += Number(order.total || 0);
      map.set(key, current);
      return map;
    }, new Map<string, DateSummary>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    counts: {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      restaurants: byRestaurant.length,
    },
    byRestaurant,
    byDate,
  };
}

export default function OwnerOrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [byRestaurant, setByRestaurant] = useState<RestaurantSummary[]>([]);
  const [byDate, setByDate] = useState<DateSummary[]>([]);
  const [counts, setCounts] = useState<Counts>({ totalOrders: 0, totalAmount: 0, restaurants: 0 });
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(0);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (restaurantId: number) => {
    setError(null);
    try {
      setLoading(true);
      const query = restaurantId ? `?restaurantId=${restaurantId}` : "";
      const res = await fetch(`/api/owner/order-history${query}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        setIsAuthorized(false);
        setOrders([]);
        return;
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to load order history");

      setIsAuthorized(true);
      const backendOrders = (Array.isArray(data.orders) ? data.orders : []).map(toHistoryOrder);
      const mergedOrders = mergeBrowserOrders(backendOrders.map(toBrowserOrder))
        .map(toHistoryOrder)
        .filter((order) => (restaurantId ? order.restaurantId === restaurantId : true))
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      if (mergedOrders.length > 0) saveBrowserOrders(mergedOrders.map(toBrowserOrder));

      const summaries = summarizeOrders(mergedOrders);
      setOrders(mergedOrders);
      setByRestaurant(summaries.byRestaurant);
      setByDate(summaries.byDate);
      setCounts(summaries.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory(0);
  }, [loadHistory]);

  const onOwnerLogin = async () => {
    setError(null);
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit owner phone number");
      return;
    }
    if (!password.trim()) {
      setError("Enter owner password");
      return;
    }

    try {
      setLoginLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password, role: "owner" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Owner login failed");
        return;
      }
      await loadHistory(selectedRestaurantId);
    } catch {
      setError("Unable to login right now");
    } finally {
      setLoginLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    return orders.reduce<Record<string, number>>((result, order) => {
      result[order.status] = (result[order.status] || 0) + 1;
      return result;
    }, {});
  }, [orders]);

  const statCards = [
    { label: "Total orders", value: counts.totalOrders, color: "#0f172a" },
    { label: "Total amount", value: `Rs ${counts.totalAmount}`, color: "#0f766e" },
    { label: "Restaurants", value: counts.restaurants, color: "#2563eb" },
    { label: "Completed", value: statusCounts.completed || 0, color: "#16a34a" },
    { label: "Pending", value: statusCounts.pending || 0, color: "#f59e0b" },
  ];

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 90px)", background: "#f8fafc", padding: "28px 18px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, color: "#0f172a", fontSize: 32, fontWeight: 900 }}>Order History</h1>
              <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 14 }}>Track all orders by restaurant with exact date and time.</p>
            </div>
            {isAuthorized ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => {
                    const nextId = Number(e.target.value);
                    setSelectedRestaurantId(nextId);
                    void loadHistory(nextId);
                  }}
                  style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "white", fontWeight: 800, color: "#0f172a" }}
                >
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
                <button onClick={() => loadHistory(selectedRestaurantId)} style={{ border: "1px solid #cbd5e1", background: "white", color: "#0f172a", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
                  Refresh
                </button>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, color: "#64748b", fontWeight: 700 }}>Loading order history...</div>
          ) : !isAuthorized ? (
            <section style={{ maxWidth: 460, background: "white", border: "1px solid #dbe4f0", borderRadius: 14, padding: 22, boxShadow: "0 12px 28px rgba(15,23,42,0.08)" }}>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24, fontWeight: 900 }}>Owner Login</h2>
              <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>Only an owner can view order history.</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="Owner phone number"
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: 14, boxSizing: "border-box", marginTop: 10 }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Owner password"
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: 14, boxSizing: "border-box", marginTop: 10 }}
              />
              {error ? <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 13 }}>{error}</p> : null}
              <button
                onClick={onOwnerLogin}
                disabled={loginLoading}
                style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 12, padding: 12, color: "white", fontWeight: 900, cursor: loginLoading ? "not-allowed" : "pointer", opacity: loginLoading ? 0.7 : 1, background: "linear-gradient(135deg, #0f766e, #2563eb)" }}
              >
                {loginLoading ? "Logging in..." : "Login and view history"}
              </button>
            </section>
          ) : (
            <>
              {error ? <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 10, padding: 12, marginBottom: 16, fontWeight: 700 }}>{error}</div> : null}

              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
                {statCards.map((stat) => (
                  <div key={stat.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                    <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>{stat.label}</div>
                    <div style={{ color: stat.color, fontSize: 30, fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
                  </div>
                ))}
              </section>

              <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 14, marginBottom: 18 }}>
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 900, color: "#0f172a" }}>Orders by restaurant</div>
                  <div style={{ display: "grid" }}>
                    {byRestaurant.length === 0 ? (
                      <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>No restaurant orders found.</div>
                    ) : (
                      byRestaurant.map((item) => (
                        <div key={`${item.restaurantId}-${item.restaurantName}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "12px 16px", borderTop: "1px solid #eef2f7" }}>
                          <div>
                            <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.restaurantName}</div>
                            <div style={{ color: "#64748b", fontSize: 12 }}>Last order: {item.latestTimestamp ? formatDateTime(item.latestTimestamp) : "Never"}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 900, color: "#2563eb" }}>{item.orderCount} orders</div>
                            <div style={{ color: "#0f766e", fontWeight: 800, fontSize: 13 }}>Rs {item.totalAmount}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 900, color: "#0f172a" }}>Orders by date</div>
                  <div style={{ display: "grid" }}>
                    {byDate.slice(0, 10).map((item) => (
                      <div key={item.date} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderTop: "1px solid #eef2f7" }}>
                        <div style={{ color: "#0f172a", fontWeight: 900 }}>{item.date}</div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#2563eb", fontWeight: 900 }}>{item.orderCount} orders</div>
                          <div style={{ color: "#0f766e", fontWeight: 800, fontSize: 13 }}>Rs {item.totalAmount}</div>
                        </div>
                      </div>
                    ))}
                    {byDate.length === 0 ? <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>No date history found.</div> : null}
                  </div>
                </div>
              </section>

              <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 900, color: "#0f172a" }}>All order history</div>
                {orders.length === 0 ? (
                  <div style={{ padding: 18, color: "#64748b", fontWeight: 700 }}>No orders found.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", color: "#475569", textAlign: "left" }}>
                          <th style={{ padding: 12 }}>Date & time</th>
                          <th style={{ padding: 12 }}>Restaurant</th>
                          <th style={{ padding: 12 }}>Customer</th>
                          <th style={{ padding: 12 }}>Items</th>
                          <th style={{ padding: 12 }}>Status</th>
                          <th style={{ padding: 12, textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} style={{ borderTop: "1px solid #eef2f7" }}>
                            <td style={{ padding: 12, color: "#334155", whiteSpace: "nowrap", fontWeight: 800 }}>{formatDateTime(order.timestamp)}</td>
                            <td style={{ padding: 12, color: "#0f172a", fontWeight: 900 }}>{order.restaurantName}</td>
                            <td style={{ padding: 12, color: "#334155" }}>
                              <div style={{ fontWeight: 800 }}>{order.customerName}</div>
                              <div style={{ color: "#64748b", fontSize: 12 }}>{order.customerPhone}</div>
                            </td>
                            <td style={{ padding: 12, color: "#334155", minWidth: 220 }}>{order.items}</td>
                            <td style={{ padding: 12, color: "#334155", textTransform: "capitalize", fontWeight: 800 }}>{order.status}</td>
                            <td style={{ padding: 12, color: "#0f766e", fontWeight: 900, textAlign: "right" }}>Rs {order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
