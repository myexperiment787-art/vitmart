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
const LEGACY_ORDER_CACHE_KEYS = [
  "customer_orders_cache",
  "owner_orders_cache_1",
  "owner_orders_cache_2",
  "owner_orders_cache_3",
  "owner_orders_cache_4",
  "delivery_orders_cache",
];

const restaurantIdsByName: Record<string, number> = {
  "momo house": 1,
  "chinese corner": 2,
  "snack attack": 3,
  "fresh bites": 4,
};

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

function stringValue(value: unknown, fallback = "") {
  return value == null ? fallback : String(value);
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBrowserOrder(value: unknown): BrowserOrder | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const order = value as Record<string, unknown>;
  const id = stringValue(order.id).trim();
  if (!id) return null;

  const restaurantName = stringValue(order.restaurantName ?? order.restaurant_name);
  const inferredRestaurantId = restaurantIdsByName[restaurantName.trim().toLowerCase()] || 0;

  return {
    id,
    customerName: stringValue(order.customerName ?? order.customer_name),
    customerPhone: stringValue(order.customerPhone ?? order.customer_phone),
    customerAddress: stringValue(order.customerAddress ?? order.customer_address, "") || null,
    items: stringValue(order.items),
    itemAmount: numberValue(order.itemAmount ?? order.item_amount),
    total: numberValue(order.total),
    timestamp: numberValue(order.timestamp, Date.now()),
    restaurantName,
    restaurantId: numberValue(order.restaurantId ?? order.restaurant_id, inferredRestaurantId),
    status: normalizeStatus(stringValue(order.status)),
    driver: stringValue(order.driver, "") || null,
    paymentId: stringValue(order.paymentId ?? order.payment_id, "") || null,
  };
}

function mergeIntoMap(byId: Map<string, BrowserOrder>, order: BrowserOrder) {
  const previous = byId.get(order.id);
  byId.set(order.id, {
    ...previous,
    ...order,
    status: highestStatus(previous?.status, order.status) as string,
  });
}

function readOrdersFromStorageKey(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map(normalizeBrowserOrder).filter((order): order is BrowserOrder => Boolean(order))
      : [];
  } catch {
    return [];
  }
}

export function readBrowserOrders(): BrowserOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const byId = new Map<string, BrowserOrder>();
    for (const key of [ORDER_CACHE_KEY, ...LEGACY_ORDER_CACHE_KEYS]) {
      for (const order of readOrdersFromStorageKey(key)) {
        mergeIntoMap(byId, order);
      }
    }

    return Array.from(byId.values()).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  } catch {
    return [];
  }
}

export function saveBrowserOrders(orders: BrowserOrder[]) {
  if (typeof window === "undefined") return;

  try {
    const current = readBrowserOrders();
    const byId = new Map<string, BrowserOrder>();

    for (const order of current) mergeIntoMap(byId, order);

    for (const order of orders) {
      const normalized = normalizeBrowserOrder(order);
      if (normalized) mergeIntoMap(byId, normalized);
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

  for (const order of current) mergeIntoMap(byId, order);

  for (const order of backendOrders) {
    const normalized = normalizeBrowserOrder(order);
    if (normalized) mergeIntoMap(byId, normalized);
  }

  return Array.from(byId.values()).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
}
