"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { mergeBrowserOrders, saveBrowserOrders, BrowserOrder } from "@/src/lib/orderBrowserCache";

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  items: string;
  itemAmount?: number;
  total: number;
  timestamp: number;
  restaurantName: string;
  restaurantId: number;
  status: string;
  driver?: string;
};

type DeliveryUser = {
  id: string;
  name: string;
  phone: string;
  driverLabel: string;
};

function toBrowserOrder(order: Order): BrowserOrder {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    items: order.items,
    itemAmount: order.itemAmount,
    total: order.total,
    timestamp: order.timestamp,
    restaurantName: order.restaurantName,
    restaurantId: order.restaurantId,
    status: order.status,
    driver: order.driver || null,
  };
}

function toDeliveryOrder(order: BrowserOrder): Order {
  return {
    id: String(order.id),
    customerName: String(order.customerName || ""),
    customerPhone: String(order.customerPhone || ""),
    customerAddress: order.customerAddress ?? undefined,
    items: String(order.items || ""),
    itemAmount: order.itemAmount,
    total: Number(order.total || 0),
    timestamp: Number(order.timestamp || Date.now()),
    restaurantName: String(order.restaurantName || ""),
    restaurantId: Number(order.restaurantId || 0),
    status: String(order.status || "pending"),
    driver: order.driver || undefined,
  };
}

function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

function isAssignedToDeliveryUser(orderDriver: string | null | undefined, user: DeliveryUser) {
  if (!orderDriver) return false;
  const driverPhone = phoneDigits(orderDriver);
  if (driverPhone && driverPhone === phoneDigits(user.phone)) return true;
  return orderDriver.trim().toLowerCase() === user.name.trim().toLowerCase();
}

function canShowOrder(order: Order, user: DeliveryUser | null) {
  if (!user) return true;
  if (!order.driver) return true;
  return isAssignedToDeliveryUser(order.driver, user);
}

function orderDisplayAmount(order: Order) {
  return order.total > 0 ? order.total : order.itemAmount && order.itemAmount > 0 ? order.itemAmount : 0;
}

function formatOrderTime(timestamp: number) {
  return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp).toLocaleString() : "";
}

function customerLine(order: Order) {
  const name = order.customerName?.trim() || "Customer";
  const phone = order.customerPhone?.trim();
  return phone ? `${name} • ${phone}` : name;
}

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryUser, setDeliveryUser] = useState<DeliveryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const ordersRef = useRef<Order[]>([]);
  const ordersPersistentRef = useRef<boolean | null>(null);

  const showToast = useCallback((text: string) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    setToasts((s) => [...s, { id, text }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/orders`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/delivery/login?next=/delivery/orders";
        return;
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Unable to load delivery orders");
      }

      setDeliveryUser(data.deliveryUser || null);
      ordersPersistentRef.current = data.persistent !== false;
      const backendOrders: Order[] = Array.isArray(data.orders) ? data.orders : [];
      const mergedOrders = mergeBrowserOrders(backendOrders.map(toBrowserOrder))
        .map(toDeliveryOrder)
        .filter((order) => canShowOrder(order, data.deliveryUser || null));
      const sorted = mergedOrders.sort((a, b) => b.timestamp - a.timestamp).map((order) => ({
        ...order,
        customerAddress: order.customerAddress ?? undefined,
      })) as Order[];
      if (sorted.length > 0) saveBrowserOrders(sorted.map(toBrowserOrder));
      ordersRef.current = sorted;
      setOrders(sorted);
    } catch (e) {
      console.error("Failed to load delivery orders:", e);
      showToast("Unable to load delivery orders");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    load();
    intervalId = setInterval(load, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [load]);

  const updateStatus = async (orderId: string, status: string) => {
    const previousOrders = ordersRef.current.length > 0 ? ordersRef.current : orders;
    const nextOrders = previousOrders.map((order) =>
      order.id === orderId
        ? { ...order, status, ...((status === "picked" || status === "completed") && deliveryUser ? { driver: deliveryUser.driverLabel } : {}) }
        : order
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    saveBrowserOrders(nextOrders.map(toBrowserOrder));

    setUpdating(orderId);
    void (async () => {
      try {
        const res = await fetch(`/api/delivery/orders`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId, status }),
        });

        if (res.status === 401) {
          window.location.href = "/delivery/login?next=/delivery/orders";
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.warn("[delivery/orders] backend status update failed", { orderId, status, httpStatus: res.status, error: data?.error });
          if (data?.persistent === false || ordersPersistentRef.current === false) {
            showToast("Saved on this browser. Connect DATABASE_URL for permanent delivery updates.");
            return;
          }
          showToast(data?.error || "Could not update order status");
          ordersRef.current = previousOrders;
          setOrders(previousOrders);
          saveBrowserOrders(previousOrders.map(toBrowserOrder));
          await load();
          return;
        }

        const data = await res.json().catch(() => null);
        if (data?.persistent === false) ordersPersistentRef.current = false;
        if (data && data.success === false) {
          console.warn("[delivery/orders] backend status update returned failure", data.error || data);
          if (data.persistent === false || ordersPersistentRef.current === false) {
            showToast("Saved on this browser. Connect DATABASE_URL for permanent delivery updates.");
            return;
          }
          showToast(data.error || "Could not update order status");
          ordersRef.current = previousOrders;
          setOrders(previousOrders);
          saveBrowserOrders(previousOrders.map(toBrowserOrder));
          await load();
          return;
        }

        saveBrowserOrders(ordersRef.current.map(toBrowserOrder));
        showToast(
          data?.persistent === false
            ? "Saved on this browser. Connect DATABASE_URL for permanent delivery updates."
            : status === "picked"
            ? "Marked picked"
            : status === "completed"
            ? "Marked delivered"
            : "Status updated"
        );
      } catch (e) {
        console.error("Failed to update order status", e);
        if (ordersPersistentRef.current === false) {
          showToast("Saved on this browser. Connect DATABASE_URL for permanent delivery updates.");
          return;
        }
        showToast("Could not save status. Please try again.");
        ordersRef.current = previousOrders;
        setOrders(previousOrders);
        saveBrowserOrders(previousOrders.map(toBrowserOrder));
        await load();
      } finally {
        setUpdating(null);
      }
    })();
  };

  const assignToMe = async (orderId: string) => {
    try {
      setUpdating(orderId);
      const res = await fetch(`/api/delivery/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, assignToMe: true }),
      });
      if (res.status === 401) {
        window.location.href = "/delivery/login?next=/delivery/orders";
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        showToast(data?.error || "Failed to claim order. Try again.");
        await load();
        return;
      }

      await load();
      showToast("Order assigned to you");
    } catch (e) {
      console.error("Failed to assign driver", e);
      showToast("Failed to claim order. Try again.");
    } finally {
      setUpdating(null);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: "delivery" }),
    }).catch(() => null);
    window.location.href = "/delivery/login";
  };

  const todayEarnings = () => {
    const now = new Date();
    const deliveredToday = orders.filter((o) => o.status === "completed" && (() => {
      const d = new Date(o.timestamp);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    })());
    const count = deliveredToday.length;
    return { count, amount: count * 10 };
  };

  const monthlyEarnings = (year: number) => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const amounts = months.map((m) => {
      const count = orders.filter((o) => {
        if (o.status !== "completed") return false;
        const d = new Date(o.timestamp);
        return d.getFullYear() === year && d.getMonth() === m;
      }).length;
      return count * 10;
    });
    return amounts;
  };

  // Visual style helpers
  const cardBase: React.CSSProperties = { borderRadius: 12, padding: 14, background: "white", border: "1px solid #e6eef8", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
  const muted: React.CSSProperties = { color: "#94a3b8" };
  const btnPrimary: React.CSSProperties = { background: "linear-gradient(90deg,#2563eb,#06b6d4)", color: "white", border: "none", padding: "10px 12px", borderRadius: 10, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 18px rgba(59,130,246,0.12)" };
  const btnSuccess: React.CSSProperties = { background: "linear-gradient(90deg,#10b981,#059669)", color: "white", border: "none", padding: "10px 12px", borderRadius: 10, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 18px rgba(16,185,129,0.08)" };
  const btnSecondary: React.CSSProperties = { padding: "10px 12px", borderRadius: 10, border: "1px solid #e6eef8", background: "white", cursor: "pointer", fontWeight: 800, color: "#0f172a" };
  const asideStyle: React.CSSProperties = { padding: 16, borderRadius: 12, background: "white", border: "1px solid #eef2f7", height: "fit-content", position: "sticky", top: 84, boxShadow: "0 6px 18px rgba(2,6,23,0.03)" };

  return (
    <div style={{ maxWidth: 1100, margin: "28px auto", padding: 18, background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)" }}>
      {toasts.length > 0 ? (
        <div style={{ position: "fixed", right: 18, bottom: 18, display: "grid", gap: 8, zIndex: 2000 }}>
          {toasts.map((toast) => (
            <div key={toast.id} style={{ background: "#0f172a", color: "white", borderRadius: 10, padding: "10px 14px", fontWeight: 800, boxShadow: "0 10px 24px rgba(15,23,42,0.22)" }}>
              {toast.text}
            </div>
          ))}
        </div>
      ) : null}
      <style>{`
        .delivery-grid { display: grid; gap: 20px; grid-template-columns: 1fr 360px; }
        @media (max-width: 900px) { .delivery-grid { grid-template-columns: 1fr; } .aside { position: static; width: 100%; }
        .card-row { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg,#06b6d4,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(59,130,246,0.12)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h10l3-5H7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#0f172a" }}>Delivery Orders</h1>
              <div style={{ color: "#64748b", marginTop: 6 }}>Manage pickups, track deliveries and view earnings.</div>
              {deliveryUser ? (
                <div style={{ color: "#334155", marginTop: 6, fontSize: 13, fontWeight: 800 }}>
                  Signed in: {deliveryUser.name} ({deliveryUser.phone})
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Today&apos;s deliveries</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{todayEarnings().count} - Rs {todayEarnings().amount}</div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 12, color: "#6b7280", marginRight: 8 }}>Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e6eef8" }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
          <button onClick={logout} style={{ ...btnSecondary, marginTop: 10 }}>Logout</button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <div style={{ marginTop: 24, padding: 28, borderRadius: 12, background: "#f8fafc", border: "1px solid #e6eef8" }}>
          <p style={{ margin: 0, fontSize: 16, color: "#94a3b8" }}>No delivery orders right now.</p>
        </div>
      ) : (
        <div className="delivery-grid" style={{ display: "grid", gap: 20, marginTop: 8 }}>
          {/* Sections: To Pickup, In Transit, Delivered */}
          {(() => {
            const toPickup = orders.filter((o) => o.status === "accepted" || o.status === "pending");
            const inTransit = orders.filter((o) => o.status === "picked");
            const delivered = orders.filter((o) => o.status === "completed");

            return (
              <>
                <section>
                  <h2 style={{ fontSize: 16, margin: "8px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>📦</span> To Pickup ({toPickup.length})</h2>
                  <div style={{ display: "grid", gap: 12 }}>
                    {toPickup.map((o) => (
                      <div key={o.id} style={{ ...cardBase, display: "flex", justifyContent: "space-between", gap: 12, borderLeft: "6px solid #f59e0b" }} className="card-row">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 900 }}>{o.restaurantName} <span style={{ fontSize: 13, marginLeft: 8, color: "#6b7280" }}>· {o.restaurantId}</span></div>
                          <div style={{ marginTop: 6, fontWeight: 800 }}>{customerLine(o)}</div>
                          <div style={{ marginTop: 8, color: "#334155" }}>{o.items}</div>
                          <div style={{ marginTop: 8, fontWeight: 700 }}>Deliver to: {o.customerAddress || "Not provided"}</div>
                        </div>
                        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                          <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "right" }}>{formatOrderTime(o.timestamp)}</div>
                          <div style={{ textAlign: "right", marginRight: 6, marginBottom: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>₹{orderDisplayAmount(o)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button disabled={!!updating} onClick={() => updateStatus(o.id, "picked")} style={btnPrimary}>{updating === o.id ? "..." : "Mark picked"}</button>
                            <button disabled={!!updating || Boolean(o.driver)} onClick={() => assignToMe(o.id)} style={{ ...btnSecondary, cursor: updating || o.driver ? "not-allowed" : "pointer", opacity: o.driver ? 0.72 : 1 }}>{o.driver ? `Assigned: ${o.driver}` : "Claim"}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {toPickup.length === 0 && <div style={muted}>No orders to pick up.</div>}
                  </div>
                </section>

                <section>
                  <h2 style={{ fontSize: 16, margin: "8px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>🚚</span> In Transit ({inTransit.length})</h2>
                  <div style={{ display: "grid", gap: 12 }}>
                    {inTransit.map((o) => (
                      <div key={o.id} style={{ ...cardBase, display: "flex", justifyContent: "space-between", gap: 12, borderLeft: "6px solid #2563eb" }} className="card-row">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 900 }}>{o.restaurantName}</div>
                          <div style={{ marginTop: 6, fontWeight: 800 }}>{customerLine(o)}</div>
                          <div style={{ marginTop: 8, color: "#334155" }}>{o.items}</div>
                          <div style={{ marginTop: 8, fontWeight: 700 }}>Deliver to: {o.customerAddress || "Not provided"}</div>
                        </div>
                        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                          <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "right" }}>{formatOrderTime(o.timestamp)}</div>
                          <div style={{ textAlign: "right", marginRight: 6, marginBottom: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>₹{orderDisplayAmount(o)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button disabled={!!updating} onClick={() => updateStatus(o.id, "completed")} style={btnSuccess}>{updating === o.id ? "..." : "Mark delivered"}</button>
                            <button disabled={!!updating || Boolean(o.driver)} onClick={() => assignToMe(o.id)} style={{ ...btnSecondary, cursor: updating || o.driver ? "not-allowed" : "pointer", opacity: o.driver ? 0.72 : 1 }}>{o.driver ? `Assigned: ${o.driver}` : "Claim"}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {inTransit.length === 0 && <div style={muted}>No in-transit orders.</div>}
                  </div>
                </section>

                <section>
                  <h2 style={{ fontSize: 16, margin: "8px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>🏁</span> Delivered ({delivered.length})</h2>
                  <div style={{ display: "grid", gap: 8 }}>
                    {delivered.slice(0, 30).map((o) => (
                      <div key={o.id} style={{ borderRadius: 10, padding: 14, background: "#f8fafc", border: "1px solid #e6eef8", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "6px solid #10b981" }} className="card-row">
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 18 }}>{customerLine(o)}</div>
                          <div style={{ fontSize: 15, color: "#334155", marginTop: 6 }}>{o.items}</div>
                          <div style={{ marginTop: 8, fontWeight: 700 }}>Deliver to: {o.customerAddress || "Not provided"}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 140 }}>
                          <div style={{ fontWeight: 900, fontSize: 18 }}>₹{orderDisplayAmount(o)}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{formatOrderTime(o.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                    {delivered.length === 0 && <div style={muted}>No delivered orders yet.</div>}
                  </div>
                </section>
              </>
            );
          })()}
          {/* Right column: monthly earnings */}
          <aside className="aside" style={asideStyle}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>Monthly earnings</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Rs 10 per delivered order</div>
            <div style={{ display: "grid", gap: 10 }}>
              {monthlyEarnings(selectedYear).map((amt, idx, arr) => {
                const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const max = Math.max(...arr, 10);
                const pct = Math.round((amt / max) * 100);
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 48, fontSize: 13, color: "#374151" }}>{monthNames[idx]}</div>
                    <div style={{ flex: 1, background: "#f1f5f9", height: 18, borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#06b6d4,#3b82f6)", borderRadius: 8 }} />
                    </div>
                    <div style={{ width: 56, textAlign: "right", fontWeight: 800 }}>Rs {amt}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: "#eef2f7", margin: "12px 0" }} />
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Your earnings</div>
            <div style={{ display: "grid", gap: 8 }}>
              {(() => {
                const count = orders.filter((o) => o.status === "completed").length;
                const amount = count * 10;
                return (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ color: "#374151" }}>{deliveryUser?.name || "You"}</div>
                    <div style={{ fontWeight: 900 }}>Rs {amount} <span style={{ color: "#64748b", fontWeight: 600, marginLeft: 8 }}>{count} del.</span></div>
                  </div>
                );
              })()}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
