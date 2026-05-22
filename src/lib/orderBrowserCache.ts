export type BrowserOrder = {
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
  driver?: string | null;
  paymentId?: string | null;
};

const ORDER_CACHE_KEY = "quickmart_all_orders_cache";

type StatusKey = "pending" | "accepted" | "picked" | "completed";

const statusRank: Record<StatusKey, number> = {
  pending: 0,
  accepted: 1,
  picked: 2,
  completed: 3,
};

function normalizeStatus(s: string | undefined): StatusKey {
  if (s === "accepted" || s === "picked" || s === "completed") return s as StatusKey;
  return "pending";
}

function highestStatus(...statuses: Array<StatusKey | string | undefined>): StatusKey {
  const normalized = statuses.map((s) => normalizeStatus(s as string | undefined));
  return normalized.reduce((current: StatusKey, next: StatusKey) => {
    return statusRank[next] > statusRank[current] ? next : current;
  }, "pending");
}

export function readBrowserOrders(): BrowserOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ORDER_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BrowserOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBrowserOrders(orders: BrowserOrder[]) {
  if (typeof window === "undefined") return;

  try {
    const current = readBrowserOrders();
    const byId = new Map<string, BrowserOrder>();

    for (const order of current) {
      byId.set(order.id, order);
    }

    for (const order of orders) {
      const previous = byId.get(order.id);
      byId.set(order.id, {
        ...previous,
        ...order,
        status: highestStatus(previous?.status, order.status) as string,
      });
    }

    const merged = Array.from(byId.values()).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    window.localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage failures in browser
  }
}

export function saveBrowserOrder(order: BrowserOrder) {
  saveBrowserOrders([order]);
}

export function mergeBrowserOrders(backendOrders: BrowserOrder[]) {
  if (!Array.isArray(backendOrders) || backendOrders.length === 0) {
    return readBrowserOrders();
  }

  const current = readBrowserOrders();
  const byId = new Map<string, BrowserOrder>();

  for (const order of current) {
    byId.set(order.id, order);
  }

  for (const order of backendOrders) {
    const previous = byId.get(order.id);
    byId.set(order.id, {
      ...previous,
      ...order,
      status: highestStatus(previous?.status, order.status) as string,
    });
  }

  return Array.from(byId.values()).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
}
