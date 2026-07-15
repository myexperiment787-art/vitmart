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

function optionalPositiveNumber(value: unknown) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function nonEmptyString(value: unknown) {
  const text = stringValue(value).trim();
  return text || undefined;
}

function orderAmount(order: Pick<BrowserOrder, "total" | "itemAmount">) {
  return optionalPositiveNumber(order.total) ?? optionalPositiveNumber(order.itemAmount);
}

function orderQuality(order: BrowserOrder) {
  return [
    nonEmptyString(order.customerName),
    nonEmptyString(order.customerPhone),
    nonEmptyString(order.customerAddress),
    nonEmptyString(order.items),
    nonEmptyString(order.restaurantName),
    optionalPositiveNumber(order.restaurantId),
    orderAmount(order),
    optionalPositiveNumber(order.timestamp),
    nonEmptyString(order.driver),
    nonEmptyString(order.paymentId),
  ].filter(Boolean).length;
}

function normalizeBrowserOrder(value: unknown): BrowserOrder | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const order = value as Record<string, unknown>;
  const id = stringValue(order.id).trim();
  if (!id) return null;

  const restaurantName = stringValue(order.restaurantName ?? order.restaurant_name);
  const inferredRestaurantId = restaurantIdsByName[restaurantName.trim().toLowerCase()] || 0;
  const itemAmount = optionalPositiveNumber(order.itemAmount ?? order.item_amount);
  const total = optionalPositiveNumber(order.total) ?? itemAmount ?? 0;

  return {
    id,
    customerName: stringValue(order.customerName ?? order.customer_name),
    customerPhone: stringValue(order.customerPhone ?? order.customer_phone),
    customerAddress: stringValue(order.customerAddress ?? order.customer_address, "") || null,
    items: stringValue(order.items),
    itemAmount,
    total,
    timestamp: numberValue(order.timestamp, 0),
    restaurantName,
    restaurantId: numberValue(order.restaurantId ?? order.restaurant_id, inferredRestaurantId),
    status: normalizeStatus(stringValue(order.status)),
    driver: stringValue(order.driver, "") || null,
    paymentId: stringValue(order.paymentId ?? order.payment_id, "") || null,
  };
}

function mergeIntoMap(byId: Map<string, BrowserOrder>, order: BrowserOrder) {
  const previous = byId.get(order.id);
  if (!previous) {
    byId.set(order.id, order);
    return;
  }

  const preferredId =
    previous.id.startsWith("order_") || !order.id.startsWith("order_")
      ? previous.id
      : order.id;

  byId.set(order.id, {
    id: preferredId,
    customerName: nonEmptyString(order.customerName) ?? previous.customerName,
    customerPhone: nonEmptyString(order.customerPhone) ?? previous.customerPhone,
    customerAddress: nonEmptyString(order.customerAddress) ?? previous.customerAddress ?? null,
    items: nonEmptyString(order.items) ?? previous.items,
    itemAmount: optionalPositiveNumber(order.itemAmount) ?? optionalPositiveNumber(previous.itemAmount),
    total: optionalPositiveNumber(order.total) ?? optionalPositiveNumber(previous.total) ?? 0,
    timestamp: optionalPositiveNumber(order.timestamp) ?? optionalPositiveNumber(previous.timestamp) ?? Date.now(),
    restaurantName: nonEmptyString(order.restaurantName) ?? previous.restaurantName,
    restaurantId: optionalPositiveNumber(order.restaurantId) ?? optionalPositiveNumber(previous.restaurantId) ?? 0,
    status: highestStatus(previous?.status, order.status) as string,
    driver: nonEmptyString(order.driver) ?? previous.driver ?? null,
    paymentId: nonEmptyString(order.paymentId) ?? previous.paymentId ?? null,
  });
}

function normalizedText(value: unknown) {
  return stringValue(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function areLikelySameOrder(a: BrowserOrder, b: BrowserOrder) {
  if (a.id === b.id) return true;
  const samePayment = nonEmptyString(a.paymentId) && a.paymentId === b.paymentId;
  if (samePayment) return true;

  const aIncomplete = !nonEmptyString(a.customerName) || !nonEmptyString(a.customerPhone) || !orderAmount(a);
  const bIncomplete = !nonEmptyString(b.customerName) || !nonEmptyString(b.customerPhone) || !orderAmount(b);
  if (!aIncomplete && !bIncomplete) return false;

  const restaurantA = optionalPositiveNumber(a.restaurantId) ?? normalizedText(a.restaurantName);
  const restaurantB = optionalPositiveNumber(b.restaurantId) ?? normalizedText(b.restaurantName);
  if (!restaurantA || !restaurantB || restaurantA !== restaurantB) return false;

  const itemsA = normalizedText(a.items);
  const itemsB = normalizedText(b.items);
  if (!itemsA || !itemsB || itemsA !== itemsB) return false;

  const timeA = optionalPositiveNumber(a.timestamp);
  const timeB = optionalPositiveNumber(b.timestamp);
  if (timeA && timeB && Math.abs(timeA - timeB) <= 30 * 60 * 1000) return true;

  const amountA = orderAmount(a);
  const amountB = orderAmount(b);
  if (amountA && amountB && amountA === amountB) return true;

  const addressA = normalizedText(a.customerAddress);
  const addressB = normalizedText(b.customerAddress);
  return Boolean(addressA && addressB && addressA === addressB);
}

function mergeSimilarOrders(orders: BrowserOrder[]) {
  const merged: BrowserOrder[] = [];

  for (const order of orders.sort((a, b) => orderQuality(b) - orderQuality(a))) {
    const index = merged.findIndex((candidate) => areLikelySameOrder(candidate, order));
    if (index < 0) {
      merged.push(order);
      continue;
    }

    const byId = new Map<string, BrowserOrder>();
    mergeIntoMap(byId, merged[index]);
    mergeIntoMap(byId, { ...order, id: merged[index].id });
    merged[index] = Array.from(byId.values())[0];
  }

  return merged.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
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

    return mergeSimilarOrders(Array.from(byId.values()));
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

    const merged = mergeSimilarOrders(Array.from(byId.values()));
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

  return mergeSimilarOrders(Array.from(byId.values()));
}
