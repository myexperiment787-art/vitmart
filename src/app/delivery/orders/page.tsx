"use client";
import { useEffect, useRef, useState } from "react";
import { mergeBrowserOrders, readBrowserOrders, saveBrowserOrders } from "@/src/lib/orderBrowserCache";

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

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const ordersRef = useRef<Order[]>([]);
  const ordersCacheKey = "delivery_orders_cache";
  const statusOverridesKey = "delivery_order_status_overrides";
  const statusRank: Record<string, number> = {
    pending: 0,
    accepted: 1,
    picked: 2,
    completed: 3,
  };

  const resolveStatus = (backendStatus: string | undefined, overrideStatus: string | undefined) => {
    const backend = backendStatus || "pending";
    const override = overrideStatus || "pending";
    return overrideStatus ? override : backend;
  };

  const resolveHighestStatus = (...statuses: Array<string | undefined>) => {
    return statuses.reduce((highest, status) => {
      const next = (status || "pending") as keyof typeof statusRank;
      const current = highest as keyof typeof statusRank;
      return statusRank[next] > statusRank[current] ? next : current;
    }, "pending");
  };

  const readStatusOverrides = () => {
    try {
      const raw = localStorage.getItem(statusOverridesKey);
      if (!raw) return {} as Record<string, string>;
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {} as Record<string, string>;
    }
  };

  const writeStatusOverride = (orderId: string, status: string) => {
    try {
      const current = readStatusOverrides();
      current[orderId] = status;
      localStorage.setItem(statusOverridesKey, JSON.stringify(current));
    } catch {}
  };

  const mergeStatusOverrides = (list: Order[]) => {
    const overrides = readStatusOverrides();
    if (Object.keys(overrides).length === 0) return list;
    return list.map((order) => {
      const mergedStatus = resolveStatus(order.status, overrides[order.id]);
      return mergedStatus === order.status ? order : { ...order, status: mergedStatus };
    });
  };

  const mergeWithCurrentState = (backendOrders: Order[]) => {
    const overrides = readStatusOverrides();
    const currentById = new Map<string, Order>(ordersRef.current.map((order: Order) => [order.id, order]));

    return backendOrders.map((backendOrder) => {
      const currentOrder = currentById.get(backendOrder.id);
      const mergedStatus = resolveHighestStatus(
        backendOrder.status,
        currentOrder?.status,
        overrides[backendOrder.id]
      );

      const mergedOrder = {
        ...currentOrder,
        ...backendOrder,
        status: mergedStatus,
      } as Order;

      return mergedOrder;
    });
  };

  const load = async () => {
    try {
      const res = await fetch(`/api/owner/orders`);
      const data = await res.json();
      const all: Order[] = data.orders || [];
      const cachedOrders = mergeBrowserOrders(all.sort((a, b) => b.timestamp - a.timestamp)).map((order) => ({
        ...order,
        customerAddress: order.customerAddress ?? undefined,
      })) as Order[];
      const sorted = mergeWithCurrentState(cachedOrders);

      if (sorted.length > 0) {
        ordersRef.current = sorted;
        setOrders(sorted);
        saveBrowserOrders(sorted);
        try {
          localStorage.setItem(ordersCacheKey, JSON.stringify(sorted));
        } catch {}
      } else {
        try {
          const browserCached = readBrowserOrders().map((order) => ({
            ...order,
            customerAddress: order.customerAddress ?? undefined,
          })) as Order[];
          if (browserCached.length > 0) {
            ordersRef.current = browserCached;
            setOrders(browserCached);
            return;
          }

          const cached = localStorage.getItem(ordersCacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as Order[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              ordersRef.current = parsed;
              setOrders(parsed);
            } else {
              ordersRef.current = [];
              setOrders([]);
            }
          } else {
            ordersRef.current = [];
            setOrders([]);
          }
        } catch {
          ordersRef.current = [];
          setOrders([]);
        }
      }

      // Auto-assign unassigned orders to default driver 'raju'
      const toAssign = sorted.filter((o: Order) => !o.driver && o.status !== "completed");
      if (toAssign.length > 0) {
        try {
          await Promise.all(toAssign.map((o) =>
            fetch(`/api/owner/orders`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: o.id, assignDriver: "raju" }),
            })
          ));
          // reload once after assignments
          const r2 = await fetch(`/api/owner/orders`);
          const d2 = await r2.json();
          const all2: Order[] = d2.orders || [];
          const sorted2 = mergeWithCurrentState(all2.sort((a, b) => b.timestamp - a.timestamp));
          if (sorted2.length > 0) {
            ordersRef.current = sorted2;
            setOrders(sorted2);
            try {
              localStorage.setItem(ordersCacheKey, JSON.stringify(sorted2));
            } catch {}
          }
        } catch (err) {
          console.error("Failed to auto-assign drivers:", err);
        }
      }
    } catch (e) {
      console.error("Failed to load delivery orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    load();
    intervalId = setInterval(load, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    const nextOrders = orders.map((order) => (order.id === orderId ? { ...order, status } : order));
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    writeStatusOverride(orderId, status);
    saveBrowserOrders(nextOrders);
    try {
      localStorage.setItem(ordersCacheKey, JSON.stringify(nextOrders));
    } catch {}

    setUpdating(orderId);
    void (async () => {
      try {
        const res = await fetch(`/api/owner/orders`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.warn("[delivery/orders] backend status update failed", { orderId, status, httpStatus: res.status, text });
          showToast(`Marked ${status} locally`);
          return;
        }

        const data = await res.json().catch(() => null);
        if (data && data.success === false) {
          console.warn("[delivery/orders] backend status update returned failure", data.error || data);
          showToast(`Marked ${status} locally`);
          return;
        }

        try {
          const current = readStatusOverrides();
          current[orderId] = status;
          localStorage.setItem(statusOverridesKey, JSON.stringify(current));
        } catch {}

        showToast(status === "picked" ? "Marked picked" : status === "completed" ? "Marked delivered" : "Status updated");
      } catch (e) {
        console.error("Failed to update order status", e);
        showToast(`Saved ${status} locally`);
      } finally {
        setUpdating(null);
      }
    })();
  };

  const showToast = (text: string) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    setToasts((s) => [...s, { id, text }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 3500);
  };

  const assignDriver = async (orderId: string) => {
    const name = prompt("Assign driver (enter name):", "DeliveryBoy");
    if (!name) return;
    try {
      setUpdating(orderId);
      const res = await fetch(`/api/owner/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, assignDriver: name }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      await load();
      showToast(`Assigned to ${name}`);
    } catch (e) {
      console.error("Failed to assign driver", e);
      alert("Failed to assign driver. Try again.");
    } finally {
      setUpdating(null);
    }
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
  const asideStyle: React.CSSProperties = { padding: 16, borderRadius: 12, background: "white", border: "1px solid #eef2f7", height: "fit-content", position: "sticky", top: 84, boxShadow: "0 6px 18px rgba(2,6,23,0.03)" };

  return (
    <div style={{ maxWidth: 1100, margin: "28px auto", padding: 18, background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)" }}>
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
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Today's deliveries</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{todayEarnings().count} • ₹{todayEarnings().amount}</div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 12, color: "#6b7280", marginRight: 8 }}>Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e6eef8" }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
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
                          <div style={{ marginTop: 6, fontWeight: 800 }}>{o.customerName} • {o.customerPhone}</div>
                          <div style={{ marginTop: 8, color: "#334155" }}>{o.items}</div>
                          <div style={{ marginTop: 8, fontWeight: 700 }}>Deliver to: {o.customerAddress || "Not provided"}</div>
                        </div>
                        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                          <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "right" }}>{new Date(o.timestamp).toLocaleString()}</div>
                          <div style={{ textAlign: "right", marginRight: 6, marginBottom: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>₹{o.total ?? (o.itemAmount ?? 0)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button disabled={!!updating} onClick={() => updateStatus(o.id, "picked")} style={btnPrimary}>{updating === o.id ? "…" : "🚚 Mark picked"}</button>
                            <button onClick={() => assignDriver(o.id)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e6eef8", background: "white", cursor: "pointer" }}>{o.driver ? `👤 ${o.driver}` : "Assign"}</button>
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
                          <div style={{ marginTop: 6, fontWeight: 800 }}>{o.customerName} • {o.customerPhone}</div>
                          <div style={{ marginTop: 8, color: "#334155" }}>{o.items}</div>
                          <div style={{ marginTop: 8, fontWeight: 700 }}>Deliver to: {o.customerAddress || "Not provided"}</div>
                        </div>
                        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                          <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "right" }}>{new Date(o.timestamp).toLocaleString()}</div>
                          <div style={{ textAlign: "right", marginRight: 6, marginBottom: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>₹{o.total ?? (o.itemAmount ?? 0)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button disabled={!!updating} onClick={() => updateStatus(o.id, "completed")} style={btnSuccess}>{updating === o.id ? "…" : "✅ Mark delivered"}</button>
                            <button onClick={() => assignDriver(o.id)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e6eef8", background: "white", cursor: "pointer" }}>{o.driver ? `👤 ${o.driver}` : "Assign"}</button>
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
                          <div style={{ fontWeight: 900, fontSize: 18 }}>{o.customerName} <span style={{ fontWeight: 800, fontSize: 15, color: "#334155" }}>• {o.customerPhone}</span></div>
                          <div style={{ fontSize: 15, color: "#334155", marginTop: 6 }}>{o.items}</div>
                          <div style={{ marginTop: 8, fontWeight: 700 }}>Deliver to: {o.customerAddress || "Not provided"}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 140 }}>
                          <div style={{ fontWeight: 900, fontSize: 18 }}>₹{o.total ?? (o.itemAmount ?? 0)}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{new Date(o.timestamp).toLocaleString()}</div>
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
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>₹10 per delivered order</div>
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
                    <div style={{ width: 56, textAlign: "right", fontWeight: 800 }}>₹{amt}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: "#eef2f7", margin: "12px 0" }} />
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Driver earnings</div>
            <div style={{ display: "grid", gap: 8 }}>
              {(() => {
                const map = new Map<string, { count: number; amount: number }>();
                orders.forEach((o) => {
                  const name = o.driver || "Unassigned";
                  if (!map.has(name)) map.set(name, { count: 0, amount: 0 });
                  const cur = map.get(name)!;
                  if (o.status === "completed") {
                    cur.count += 1;
                    cur.amount += 10;
                  }
                });
                return Array.from(map.entries()).map(([name, v]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ color: "#374151" }}>{name}</div>
                    <div style={{ fontWeight: 900 }}>₹{v.amount} <span style={{ color: "#64748b", fontWeight: 600, marginLeft: 8 }}>{v.count} del.</span></div>
                  </div>
                ));
              })()}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
