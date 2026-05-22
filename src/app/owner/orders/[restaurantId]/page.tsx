"use client";
import { useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { mergeBrowserOrders, readBrowserOrders, saveBrowserOrders, BrowserOrder } from "@/src/lib/orderBrowserCache";

const restaurantMenuItems: Record<number, string[]> = {
  1: ["Veg Momo (8 pcs)", "Fried Momo (8 pcs)", "Paneer Momo (8 pcs)", "Tandoori Momo (8 pcs)", "Momo Soup"],
  2: ["Chowmein (Half)", "Chowmein (Full)", "Manchurian (Half)", "Manchurian (Full)", "Fried Rice", "Spring Roll (2 pcs)"],
  3: ["French Fries (Half)", "French Fries (Full)", "Chilli Potato (Half)", "Chilli Potato (Full)", "Pani Puri (6 pcs)", "Chaat Papdi", "Samosa (2 pcs)", "Aloo Tikki (2 pcs)"],
  4: ["Fruit Bowl", "Bhel Puri", "Dahi Puri (6 pcs)", "Veg Sandwich", "Corn Cup"],
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  driver?: string;
  items: string;
  itemAmount?: number;
  total: number;
  paymentId: string;
  timestamp: number;
  restaurantName: string;
  restaurantId: number;
  status: "pending" | "accepted" | "picked" | "completed";
};

function toOwnerOrder(order: any): Order {
  return {
    id: String(order.id ?? ""),
    customerName: String(order.customerName ?? order.customer_name ?? ""),
    customerPhone: String(order.customerPhone ?? order.customer_phone ?? ""),
    customerAddress: order.customerAddress ?? order.customer_address ?? undefined,
    driver: order.driver ?? null,
    items: String(order.items ?? ""),
    itemAmount: order.itemAmount ?? order.item_amount ?? undefined,
    total: Number(order.total ?? 0),
    paymentId: String(order.paymentId ?? order.payment_id ?? ""),
    timestamp: Number(order.timestamp ?? Date.now()),
    restaurantName: String(order.restaurantName ?? order.restaurant_name ?? ""),
    restaurantId: Number(order.restaurantId ?? order.restaurant_id ?? 0),
    status: (order.status === "accepted"
      ? "accepted"
      : order.status === "picked"
      ? "picked"
      : order.status === "completed"
      ? "completed"
      : "pending") as Order["status"],
  };
}

function ownerOrderToBrowserOrder(o: Order): BrowserOrder {
  return {
    id: o.id,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress ?? undefined,
    items: o.items,
    itemAmount: o.itemAmount,
    total: o.total,
    timestamp: o.timestamp,
    restaurantName: o.restaurantName,
    restaurantId: o.restaurantId,
    status: o.status,
    driver: o.driver ?? null,
    paymentId: o.paymentId ?? null,
  };
}

const restaurantNames: { [key: number]: string } = {
  1: "Momo House",
  2: "Chinese Corner",
  3: "Snack Attack",
  4: "Fresh Bites",
};

export default function OwnerRestaurantOrdersPage() {
  const params = useParams();
  const restaurantId = parseInt(params.restaurantId as string);
  const restaurantName = restaurantNames[restaurantId] || "Unknown Restaurant";
  const lastOrderCountStorageKey = `owner_last_order_count_${restaurantId}`;
  const ordersStorageKey = `owner_orders_cache_${restaurantId}`;
  const debugOrderNotifications = true;

  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const lastOrderCountRef = useRef<number>(0);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const ordersRef = useRef<Order[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [shopStatus, setShopStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);
  const [savingShopStatus, setSavingShopStatus] = useState(false);
  const [savingItemName, setSavingItemName] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const [ringtoneVolume, setRingtoneVolume] = useState(0.9);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }

    return audioContextRef.current;
  };

  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [formattedTimes, setFormattedTimes] = useState<Record<string, string>>({});

  const seenOrderIdsStorageKey = `owner_seen_order_ids_${restaurantId}`;

  const readSeenOrderIds = () => {
    try {
      const raw = sessionStorage.getItem(seenOrderIdsStorageKey);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw) as string[];
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
    } catch {
      return new Set<string>();
    }
  };

  const saveSeenOrderIds = (ids: Set<string>) => {
    try {
      sessionStorage.setItem(seenOrderIdsStorageKey, JSON.stringify(Array.from(ids)));
    } catch {}
  };

  const enableAudio = async () => {
    try {
      const audio = getAudioContext();
      if (audio.state === "suspended") await audio.resume();
      localStorage.setItem("owner_audio_enabled", "1");
      setAudioEnabled(true);
    } catch (e) {
      console.warn("Failed to enable audio:", e);
    }
  };

  const handleVolumeChange = (value: number) => {
    const nextVolume = Math.min(1, Math.max(0.1, value));
    setRingtoneVolume(nextVolume);

    try {
      localStorage.setItem("owner_ringtone_volume", String(nextVolume));
    } catch (e) {
      // ignore storage errors
    }
  };

  // Read persisted audio preference after hydration to avoid hydration mismatch
  useEffect(() => {
    try {
      const v = localStorage.getItem("owner_audio_enabled");
      if (v) setAudioEnabled(true);

      const savedVolume = localStorage.getItem("owner_ringtone_volume");
      if (savedVolume) {
        const parsed = parseFloat(savedVolume);
        if (!Number.isNaN(parsed)) {
          setRingtoneVolume(Math.min(1, Math.max(0.1, parsed)));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [shopRes, stockRes] = await Promise.all([
          fetch("/api/shop-status", { cache: "no-store" }),
          fetch(`/api/stock-status?restaurantId=${restaurantId}`, { cache: "no-store" }),
        ]);

        const shopData = await shopRes.json();
        const stockData = await stockRes.json();

        setShopStatus(shopData.status === "CLOSED" ? "CLOSED" : "OPEN");
        setOutOfStockItems(Array.isArray(stockData.outOfStockItems) ? stockData.outOfStockItems : []);
      } catch (error) {
        console.error("Failed to load shop settings:", error);
      }
    };

    loadSettings();
    const interval = setInterval(loadSettings, 10000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const playRingtone = () => {
    const audioContext = getAudioContext();

    // stop any previous oscillator to avoid overlapping tones
    try {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
        try {
          oscillatorRef.current.disconnect();
        } catch (e) {}
        oscillatorRef.current = null;
      }
    } catch (e) {}

    const now = audioContext.currentTime;
    const peakVolume = Math.min(1, Math.max(0.1, ringtoneVolume));

    const melody = [
      { frequency: 784, duration: 0.36 },
      { frequency: 988, duration: 0.36 },
      { frequency: 1175, duration: 0.45 },
      { frequency: 988, duration: 0.28 },
      { frequency: 784, duration: 0.36 },
      { frequency: 659, duration: 0.45 },
      { frequency: 784, duration: 0.36 },
      { frequency: 988, duration: 0.36 },
      { frequency: 1175, duration: 0.45 },
      { frequency: 988, duration: 0.28 },
      { frequency: 784, duration: 0.36 },
      { frequency: 659, duration: 0.45 },
    ];

    let startTime = now;

    melody.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = note.frequency;

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(peakVolume, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration + 0.02);

      startTime += note.duration + 0.06;

      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {}
      }, (startTime - now) * 1000 + 200);
    });

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => undefined);
    }

    // keep a reference only for stopping any future overlap
    oscillatorRef.current = audioContext.createOscillator();
    try {
      oscillatorRef.current.disconnect();
    } catch (e) {}

    setTimeout(() => {
      try {
        if (oscillatorRef.current) {
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
        }
      } catch (e) {}
    }, 11000);
  };

  // Fetch orders from API endpoint for this restaurant only
  useEffect(() => {
    try {
      seenOrderIdsRef.current = readSeenOrderIds();

      const storedOrders = sessionStorage.getItem(ordersStorageKey);
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders) as Order[];
        if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
          const normalizedStoredOrders = parsedOrders.map(toOwnerOrder);
          ordersRef.current = normalizedStoredOrders;
          setOrders(normalizedStoredOrders);
        }
      }

      const stored = sessionStorage.getItem(lastOrderCountStorageKey);
      if (stored !== null) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          lastOrderCountRef.current = parsed;
          setLastOrderCount(parsed);
          if (debugOrderNotifications) {
            console.log("[owner-orders] restored lastOrderCount", {
              restaurantId,
              lastOrderCount: parsed,
            });
          }
        }
      }
    } catch (error) {
      if (debugOrderNotifications) {
        console.warn("[owner-orders] failed to restore lastOrderCount", error);
      }
    }
  }, [lastOrderCountStorageKey, ordersStorageKey, restaurantId]);

  useEffect(() => {
    const loadOrders = async () => {
      const startedAt = Date.now();
      try {
        const res = await fetch(`/api/owner/orders?restaurantId=${restaurantId}`);
        const data = await res.json();
        const orderList: Order[] = (data.orders || []).filter(
          (o: Order) => o.restaurantId === restaurantId
        );
        const pendingOrders = orderList.filter((order) => order.status === "pending");
        const unseenPendingOrders = pendingOrders.filter((order) => !seenOrderIdsRef.current.has(order.id));

        // Play ringtone only when a brand new pending order id appears.
        // This avoids re-alerting when an order moves from accepted -> picked.
        const prevCount = lastOrderCountRef.current;
        const nextCount = orderList.length;

        if (debugOrderNotifications) {
          console.log("[owner-orders] poll", {
            restaurantId,
            prevCount,
            nextCount,
            pendingCount: pendingOrders.length,
            unseenPendingCount: unseenPendingOrders.length,
            audioEnabled,
            elapsedMs: Date.now() - startedAt,
          });
        }

        if (unseenPendingOrders.length > 0) {
          if (audioEnabled) {
            try {
              playRingtone();
              if (debugOrderNotifications) {
                console.log("[owner-orders] ringtone played", {
                  restaurantId,
                  prevCount,
                  nextCount,
                  unseenPendingIds: unseenPendingOrders.map((order) => order.id),
                });
              }
            } catch (e) {
              console.warn("Failed to play ringtone", e);
            }
          } else {
            console.info("New order arrived but audio is disabled. Call enableAudio() to allow ringtone.");
          }
        }

        const sorted = mergeBrowserOrders(orderList.sort((a, b) => b.timestamp - a.timestamp)).map(toOwnerOrder);
        const nextOrders = sorted.length > 0 ? sorted : ordersRef.current;

        if (sorted.length === 0 && ordersRef.current.length > 0) {
          if (debugOrderNotifications) {
            console.warn("[owner-orders] empty poll ignored to avoid clearing cached orders", {
              restaurantId,
              previousCount: ordersRef.current.length,
            });
          }
        }

        ordersRef.current = nextOrders;
        setOrders(nextOrders);
        try {
          saveBrowserOrders(nextOrders.map(ownerOrderToBrowserOrder));
        } catch (e) {
          // ignore storage errors
        }
        const nextSeenIds = new Set(seenOrderIdsRef.current);
        nextOrders.forEach((order) => nextSeenIds.add(order.id));
        seenOrderIdsRef.current = nextSeenIds;
        saveSeenOrderIds(nextSeenIds);
        setLastOrderCount(nextOrders.length);
        lastOrderCountRef.current = nextOrders.length;

        try {
          sessionStorage.setItem(lastOrderCountStorageKey, String(nextOrders.length));
          sessionStorage.setItem(ordersStorageKey, JSON.stringify(nextOrders));
        } catch (error) {
          if (debugOrderNotifications) {
            console.warn("[owner-orders] failed to persist lastOrderCount", error);
          }
        }

        // compute formatted timestamps on client only (avoid server/client mismatch)
        const times: Record<string, string> = {};
        sorted.forEach((o) => {
          try {
            times[o.id] = String(o.timestamp);
          } catch (e) {
            times[o.id] = "";
          }
        });
        setFormattedTimes(times);
      } catch (error) {
        console.error("Failed to load orders:", error);
      }
    };

    // start polling once per mount (or when restaurantId/audioEnabled changes)
    loadOrders();
    const interval = setInterval(loadOrders, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [restaurantId, audioEnabled]);

  const markOrderAsAccepted = async (orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((order) =>
        order.id === orderId ? ({ ...order, status: "accepted" } as Order) : order
      );
      ordersRef.current = next;
      try {
        saveBrowserOrders(next.map(ownerOrderToBrowserOrder));
      } catch (e) {}
      try {
        localStorage.setItem(ordersStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch("/api/owner/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "accepted" }),
      });
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const markOrderAsCompleted = async (orderId: string) => {
    setOrders((prev) => {
      const next = prev.filter((order) => order.id !== orderId);
      ordersRef.current = next;
      try {
        saveBrowserOrders(next.map(ownerOrderToBrowserOrder));
      } catch (e) {}
      try {
        localStorage.setItem(ordersStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch("/api/owner/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "completed" }),
      });
    } catch (error) {
      console.error("Failed to complete order:", error);
    }
  };

  const toggleShopStatus = async () => {
    const nextStatus = shopStatus === "OPEN" ? "CLOSED" : "OPEN";
    setSavingShopStatus(true);
    setShopStatus(nextStatus);

    try {
      const res = await fetch("/api/shop-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update shop status");
      }
    } catch (error) {
      console.error("Failed to update shop status:", error);
      setShopStatus(nextStatus === "OPEN" ? "CLOSED" : "OPEN");
      alert("Unable to update shop status right now.");
    } finally {
      setSavingShopStatus(false);
    }
  };

  const toggleItemAvailability = async (itemName: string) => {
    const nextAvailable = outOfStockItems.includes(itemName);
    const nextItems = nextAvailable
      ? outOfStockItems.filter((name) => name !== itemName)
      : [...outOfStockItems, itemName];

    setSavingItemName(itemName);
    setOutOfStockItems(nextItems);

    try {
      const res = await fetch("/api/stock-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          itemName,
          available: nextAvailable,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update item availability");
      }
    } catch (error) {
      console.error("Failed to update item availability:", error);
      setOutOfStockItems(nextItems.includes(itemName) ? outOfStockItems : [...nextItems, itemName]);
      alert("Unable to update item availability right now.");
    } finally {
      setSavingItemName(null);
    }
  };

  const menuItems = restaurantMenuItems[restaurantId] || [];

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "accepted" || o.status === "picked");

  return (
    <>
      {showInstructions && (
        <div
          style={{
            background: "#dbeafe",
            border: "2px solid #0284c7",
            borderRadius: "12px",
            padding: "16px 20px",
            margin: "20px 24px",
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700, color: "#0c4a6e" }}>
                📱 {restaurantName} - Keep this page open on your phone/tablet
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#0c4a6e", lineHeight: "1.6" }}>
                You will hear a ringtone when new orders arrive. Tap "Accept Order" to acknowledge you received it. Only you can see orders for {restaurantName}.
              </p>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#0c4a6e",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Enable sound prompt - required for mobile browsers that block autoplay */}
      {!audioEnabled && (
        <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 1200 }}>
          <button
            onClick={enableAudio}
            style={{
              background: "linear-gradient(135deg,#2563eb,#0ea5e9)",
              color: "white",
              border: "none",
              padding: "10px 14px",
              borderRadius: "10px",
              fontWeight: 800,
              boxShadow: "0 8px 20px rgba(14,165,233,0.18)",
              cursor: "pointer",
            }}
          >
            🔔 Enable Sound
          </button>
        </div>
      )}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 18px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid #dbe4f0",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>Shop Control</p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                Open or close the shop and mark individual items unavailable.
              </p>
            </div>

            <button
              onClick={toggleShopStatus}
              disabled={savingShopStatus}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "12px 18px",
                color: "white",
                background: shopStatus === "OPEN" ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #16a34a, #22c55e)",
                fontWeight: 900,
                fontSize: "14px",
                cursor: savingShopStatus ? "not-allowed" : "pointer",
                opacity: savingShopStatus ? 0.7 : 1,
              }}
            >
              {savingShopStatus
                ? "Saving..."
                : shopStatus === "OPEN"
                ? "🔴 Close Shop"
                : "🟢 Open Shop"}
            </button>
          </div>

          <div style={{ marginTop: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Item Availability</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              {menuItems.map((itemName) => {
                const available = !outOfStockItems.includes(itemName);
                return (
                  <button
                    key={itemName}
                    onClick={() => toggleItemAvailability(itemName)}
                    disabled={savingItemName === itemName}
                    style={{
                      border: "1px solid",
                      borderColor: available ? "#86efac" : "#fca5a5",
                      borderRadius: "14px",
                      padding: "12px",
                      background: available ? "#f0fdf4" : "#fef2f2",
                      color: available ? "#166534" : "#991b1b",
                      textAlign: "left",
                      cursor: savingItemName === itemName ? "not-allowed" : "pointer",
                      fontWeight: 800,
                      boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)",
                      opacity: savingItemName === itemName ? 0.75 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", lineHeight: 1.4 }}>{itemName}</span>
                      <span style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{available ? "Available" : "Not available"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", left: 18, bottom: 18, zIndex: 1200 }}>
        <button
          onClick={() => setShowSettingsPanel((prev) => !prev)}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(135deg, #0f172a, #334155)",
            color: "white",
            fontSize: "18px",
            fontWeight: 900,
            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.24)",
            cursor: "pointer",
          }}
          aria-label="Open settings"
        >
          ⚙
        </button>

        {showSettingsPanel && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: "58px",
              width: "min(92vw, 340px)",
              background: "white",
              border: "1px solid #dbe4f0",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 16px 36px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "#0f172a" }}>Settings</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>Adjust ringtone volume</p>
              </div>
              <button
                onClick={() => setShowSettingsPanel(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#f1f5f9",
                  color: "#0f172a",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div style={{ padding: "6px 0 2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>Ringtone Volume</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#2563eb" }}>{Math.round(ringtoneVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={ringtoneVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  height: "18px",
                  cursor: "pointer",
                  touchAction: "none",
                }}
              />
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                Bigger slider for mobile use. Your preference is saved automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
            📦 {restaurantName} Orders
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Only your restaurant's orders are visible here
          </p>
        </div>

        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
          Pending orders: <strong style={{ color: "#dc2626", fontSize: "16px" }}>{pendingOrders.length}</strong>
        </p>

        {pendingOrders.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "2px dashed #e2e8f0",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <p style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>No pending orders</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>New orders will appear here when customers pay</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px", marginBottom: "32px" }}>
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: "white",
                  border: "3px solid #ef4444",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 10px 25px rgba(239, 68, 68, 0.15)",
                  animation: "pulse 2s infinite",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                      🔴 NEW ORDER
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#ef4444", fontWeight: 700 }}>
                      {restaurantName}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#64748b" }}>
                      {formattedTimes[order.id] ? new Date(formattedTimes[order.id]).toLocaleTimeString() : ""}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                      ID: {order.id.slice(0, 6)}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8f9fa",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "12px",
                    borderLeft: "4px solid #0284c7",
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    👤 {order.customerName} • {order.customerPhone}
                  </p>
                    {order.customerAddress && (
                      <p style={{ margin: "6px 0 6px", fontSize: "13px", color: "#374151" }}>
                        📍 {order.customerAddress}
                      </p>
                    )}
                    {order.driver && (
                      <p style={{ margin: "6px 0 6px", fontSize: "13px", color: "#374151" }}>
                        🧑‍🚚 {order.driver}
                      </p>
                    )}
                    <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#1f2937", lineHeight: 1.5 }}>
                    {order.items}
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#16a34a" }}>
                    Item Amount: ₹{order.itemAmount ?? order.total}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => markOrderAsAccepted(order.id)}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    ✓ Accept Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Recent orders (including accepted/completed) */}
        <div style={{ marginTop: "28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
            🕒 Recent Orders
          </h2>
          {orders.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No recent orders yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} style={{ background: "white", borderRadius: "10px", padding: "16px", border: "1px solid #e6eef8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "19px", fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
                        {order.customerName} • {order.customerPhone}
                      </p>
                      {order.customerAddress && (
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#374151" }}>📍 {order.customerAddress}</p>
                      )}
                      {order.driver && (
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#374151" }}>🧑‍🚚 {order.driver}</p>
                      )}
                      <p style={{ margin: "8px 0 0", fontSize: "17px", fontWeight: 900, color: "#2563eb", lineHeight: 1.5 }}>
                        Item Amount: ₹{order.itemAmount ?? order.total}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: "15px", fontWeight: 700, color: "#334155", lineHeight: 1.5 }}>
                        {order.items}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>{formattedTimes[order.id] ? new Date(Number(formattedTimes[order.id])).toLocaleString() : ""}</p>
                      <p style={{ margin: "8px 0 0", fontSize: "13px", fontWeight: 900, color: order.status === "pending" ? "#dc2626" : order.status === "accepted" ? "#0ea5e9" : "#16a34a" }}>{order.status.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </>
  );
}
