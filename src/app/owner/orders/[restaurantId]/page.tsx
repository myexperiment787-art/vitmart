"use client";
import { useCallback, useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { mergeBrowserOrders, saveBrowserOrders, BrowserOrder } from "@/src/lib/orderBrowserCache";
import { isItemListedOutOfStock, normalizeMenuItemName } from "@/src/lib/itemAvailability";

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
  driver?: string | null;
  items: string;
  itemAmount?: number;
  total: number;
  paymentId: string;
  timestamp: number;
  restaurantName: string;
  restaurantId: number;
  status: "pending" | "accepted" | "picked" | "completed";
};

type OwnerOrderInput = {
  id?: unknown;
  customerName?: unknown;
  customer_name?: unknown;
  customerPhone?: unknown;
  customer_phone?: unknown;
  customerAddress?: unknown;
  customer_address?: unknown;
  driver?: unknown;
  items?: unknown;
  itemAmount?: unknown;
  item_amount?: unknown;
  total?: unknown;
  paymentId?: unknown;
  payment_id?: unknown;
  timestamp?: unknown;
  restaurantName?: unknown;
  restaurant_name?: unknown;
  restaurantId?: unknown;
  restaurant_id?: unknown;
  status?: unknown;
};

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" ? value : value == null ? undefined : Number(value);
}

function toOwnerOrder(order: OwnerOrderInput): Order {
  return {
    id: String(order.id ?? ""),
    customerName: String(order.customerName ?? order.customer_name ?? ""),
    customerPhone: String(order.customerPhone ?? order.customer_phone ?? ""),
    customerAddress: optionalString(order.customerAddress) ?? optionalString(order.customer_address),
    driver: optionalString(order.driver) ?? null,
    items: String(order.items ?? ""),
    itemAmount: optionalNumber(order.itemAmount) ?? optionalNumber(order.item_amount),
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
  const shopStatusCacheKey = `owner_shop_status_${restaurantId}`;
  const stockItemsCacheKey = `owner_stock_items_${restaurantId}`;
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
  const savingShopStatusRef = useRef(false);
  const savingItemNameRef = useRef<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerLoginLoading, setOwnerLoginLoading] = useState(false);
  const [ownerAuthError, setOwnerAuthError] = useState<string | null>(null);
  const [settingsWarning, setSettingsWarning] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const [ringtoneVolume, setRingtoneVolume] = useState(0.9);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("AudioContext is not supported in this browser.");
      }
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

  const readCachedShopStatus = useCallback(() => {
    try {
      const cached = localStorage.getItem(shopStatusCacheKey);
      return cached === "CLOSED" ? "CLOSED" : cached === "OPEN" ? "OPEN" : null;
    } catch {
      return null;
    }
  }, [shopStatusCacheKey]);

  const writeCachedShopStatus = useCallback((status: "OPEN" | "CLOSED") => {
    try {
      localStorage.setItem(shopStatusCacheKey, status);
    } catch {}
  }, [shopStatusCacheKey]);

  const readCachedStockItems = useCallback(() => {
    try {
      const cached = localStorage.getItem(stockItemsCacheKey);
      if (!cached) return null;
      const parsed = JSON.parse(cached) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }, [stockItemsCacheKey]);

  const writeCachedStockItems = useCallback((items: string[]) => {
    try {
      localStorage.setItem(stockItemsCacheKey, JSON.stringify(items));
    } catch {}
  }, [stockItemsCacheKey]);

  const requireOwnerLogin = (message = "Owner login is required to manage this restaurant.") => {
    setIsAuthorized(false);
    setOwnerAuthError(message);
  };

  const onOwnerLogin = async () => {
    setOwnerAuthError(null);
    if (ownerPhone.replace(/\D/g, "").length !== 10) {
      setOwnerAuthError("Enter a valid 10-digit owner phone number");
      return;
    }
    if (!ownerPassword.trim()) {
      setOwnerAuthError("Enter owner password");
      return;
    }

    try {
      setOwnerLoginLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: ownerPhone, password: ownerPassword, role: "owner" }),
      });
      const data = await res.json();
      if (!data.success) {
        setOwnerAuthError(data.error || "Owner login failed");
        return;
      }

      setOwnerPassword("");
      setOwnerAuthError(null);
      setIsAuthorized(true);
    } catch {
      setOwnerAuthError("Unable to login right now");
    } finally {
      setOwnerLoginLoading(false);
    }
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
        if (savingShopStatusRef.current || savingItemNameRef.current) return;

        const cachedShopStatus = readCachedShopStatus();
        const cachedStockItems = readCachedStockItems();
        if (cachedShopStatus) setShopStatus(cachedShopStatus);
        if (cachedStockItems) setOutOfStockItems(cachedStockItems);

        const [shopRes, stockRes] = await Promise.all([
          fetch(`/api/shop-status?restaurantId=${restaurantId}`, { cache: "no-store" }),
          fetch(`/api/stock-status?restaurantId=${restaurantId}`, { cache: "no-store" }),
        ]);

        const shopData = await shopRes.json().catch(() => null);
        const stockData = await stockRes.json().catch(() => null);
        if (!shopRes.ok || !stockRes.ok || shopData?.success === false || stockData?.success === false) {
          throw new Error(shopData?.error || stockData?.error || "Failed to load settings");
        }

        const persistenceWarning =
          shopData?.persistent === false || stockData?.persistent === false
            ? "Permanent database is not connected. Changes are cached in this browser and may reset for customers or after deployment."
            : null;
        setSettingsWarning(persistenceWarning);

        const nextShopStatus = shopData.status === "CLOSED" ? "CLOSED" : "OPEN";
        const nextStockItems = Array.isArray(stockData.outOfStockItems) ? stockData.outOfStockItems.map(String) : [];

        setShopStatus(shopData?.persistent === false && cachedShopStatus ? cachedShopStatus : nextShopStatus);
        setOutOfStockItems(stockData?.persistent === false && cachedStockItems ? cachedStockItems : nextStockItems);
      } catch (error) {
        console.error("Failed to load shop settings:", error);
        setSettingsWarning("Unable to refresh shop settings right now. The page is keeping the last value shown here.");
      }
    };

    loadSettings();
    const interval = setInterval(loadSettings, 10000);
    return () => clearInterval(interval);
  }, [restaurantId, readCachedShopStatus, readCachedStockItems]);

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
      if (isAuthorized === false) return;

      const startedAt = Date.now();
      try {
        const res = await fetch(`/api/owner/orders?restaurantId=${restaurantId}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (res.status === 401) {
          setOrders([]);
          requireOwnerLogin();
          return;
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to load orders");
        setIsAuthorized(true);
        setOwnerAuthError(null);

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
        if (isAuthorized === null) {
          requireOwnerLogin("Unable to verify owner login. Please login again.");
        }
      }
    };

    // start polling once per mount (or when restaurantId/audioEnabled changes)
    loadOrders();
    const interval = setInterval(loadOrders, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [restaurantId, audioEnabled, isAuthorized]);

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
        credentials: "include",
        body: JSON.stringify({ orderId, status: "accepted" }),
      }).then(async (res) => {
        if (res.status === 401) {
          requireOwnerLogin("Owner login expired. Please login again.");
          return;
        }
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to update order status");
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
        credentials: "include",
        body: JSON.stringify({ orderId, status: "completed" }),
      }).then(async (res) => {
        if (res.status === 401) {
          requireOwnerLogin("Owner login expired. Please login again.");
          return;
        }
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to complete order");
      });
    } catch (error) {
      console.error("Failed to complete order:", error);
    }
  };

  const toggleShopStatus = async () => {
    const previousStatus = shopStatus;
    const nextStatus = shopStatus === "OPEN" ? "CLOSED" : "OPEN";
    savingShopStatusRef.current = true;
    setSavingShopStatus(true);
    setShopStatus(nextStatus);
    writeCachedShopStatus(nextStatus);

    try {
      const res = await fetch("/api/shop-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus, restaurantId }),
      });

      if (res.status === 401) {
        requireOwnerLogin("Owner login expired. Please login again.");
        throw new Error("Unauthorized");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update shop status");
      }
      const savedStatus = data.status === "CLOSED" ? "CLOSED" : "OPEN";
      setShopStatus(savedStatus);
      writeCachedShopStatus(savedStatus);
      if (data.persistent === false) {
        setSettingsWarning("Permanent database is not connected. Changes are cached in this browser and may reset for customers or after deployment.");
      }
    } catch (error) {
      console.error("Failed to update shop status:", error);
      setShopStatus(previousStatus);
      writeCachedShopStatus(previousStatus);
      alert("Unable to update shop status right now.");
    } finally {
      savingShopStatusRef.current = false;
      setSavingShopStatus(false);
    }
  };

  const toggleItemAvailability = async (itemName: string) => {
    const previousItems = outOfStockItems;
    const nextAvailable = isItemListedOutOfStock(itemName, outOfStockItems);
    const normalizedItemName = normalizeMenuItemName(itemName);
    const nextItems = nextAvailable
      ? outOfStockItems.filter((name) => normalizeMenuItemName(name) !== normalizedItemName)
      : [...outOfStockItems, itemName];

    savingItemNameRef.current = itemName;
    setSavingItemName(itemName);
    setOutOfStockItems(nextItems);
    writeCachedStockItems(nextItems);

    try {
      const res = await fetch("/api/stock-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          restaurantId,
          itemName,
          available: nextAvailable,
        }),
      });

      if (res.status === 401) {
        requireOwnerLogin("Owner login expired. Please login again.");
        throw new Error("Unauthorized");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update item availability");
      }
      const savedItems = Array.isArray(data.outOfStockItems) ? data.outOfStockItems.map(String) : nextItems;
      setOutOfStockItems(savedItems);
      writeCachedStockItems(savedItems);
      if (data.persistent === false) {
        setSettingsWarning("Permanent database is not connected. Changes are cached in this browser and may reset for customers or after deployment.");
      }
    } catch (error) {
      console.error("Failed to update item availability:", error);
      setOutOfStockItems(previousItems);
      writeCachedStockItems(previousItems);
      alert("Unable to update item availability right now.");
    } finally {
      savingItemNameRef.current = null;
      setSavingItemName(null);
    }
  };

  const menuItems = restaurantMenuItems[restaurantId] || [];

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "accepted" || o.status === "picked");

  if (isAuthorized === false) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", padding: "24px" }}>
        <section style={{ width: "100%", maxWidth: "460px", background: "white", border: "1px solid #dbe4f0", borderRadius: "16px", padding: "24px", boxShadow: "0 14px 34px rgba(15,23,42,0.1)" }}>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: "28px", fontWeight: 900 }}>{restaurantName} Owner Login</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "14px", lineHeight: 1.5 }}>
            Login as owner to view orders, close the shop, and mark items unavailable.
          </p>
          <input
            type="tel"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="Owner phone number"
            style={{ width: "100%", marginTop: "18px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />
          <input
            type="password"
            value={ownerPassword}
            onChange={(e) => setOwnerPassword(e.target.value)}
            placeholder="Owner password"
            style={{ width: "100%", marginTop: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />
          {ownerAuthError ? <p style={{ color: "#dc2626", fontSize: "13px", fontWeight: 700, marginTop: "10px" }}>{ownerAuthError}</p> : null}
          <button
            onClick={onOwnerLogin}
            disabled={ownerLoginLoading}
            style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", color: "white", fontWeight: 900, background: "linear-gradient(135deg, #0f766e, #2563eb)", cursor: ownerLoginLoading ? "not-allowed" : "pointer", opacity: ownerLoginLoading ? 0.7 : 1 }}
          >
            {ownerLoginLoading ? "Logging in..." : "Login"}
          </button>
        </section>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#475569", fontWeight: 800 }}>
        Checking owner login...
      </div>
    );
  }

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
                You will hear a ringtone when new orders arrive. Tap &quot;Accept Order&quot; to acknowledge you received it. Only you can see orders for {restaurantName}.
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

          {settingsWarning ? (
            <p
              style={{
                margin: "12px 0 0",
                padding: "9px 11px",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                background: "#fffbeb",
                color: "#92400e",
                fontSize: "12px",
                fontWeight: 800,
                lineHeight: 1.5,
              }}
            >
              {settingsWarning}
            </p>
          ) : null}

          <div style={{ marginTop: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Item Availability</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              {menuItems.map((itemName) => {
                const available = !isItemListedOutOfStock(itemName, outOfStockItems);
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
            Only your restaurant&apos;s orders are visible here
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
