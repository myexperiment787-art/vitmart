import { isDatabaseConfigured, query } from "@/src/lib/db";
import { readLocalOrders, writeLocalOrders, readLocalUsers } from "@/src/lib/localStore";

export type AppOrder = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  items: string;
  item_amount: number;
  total: number;
  payment_id: string | null;
  timestamp: number;
  restaurant_name: string;
  restaurant_id: number;
  status: string;
  driver: string | null;
};

export async function createOrder(order: {
  id: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  items: string;
  itemAmount: number;
  total: number;
  paymentId?: string | null;
  timestamp: number;
  restaurantName: string;
  restaurantId: number;
  status: string;
  driver?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    const orders = readLocalOrders();
    orders.push({
      id: order.id,
      customer_id: order.customerId || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_address: order.customerAddress || null,
      items: order.items,
      item_amount: order.itemAmount,
      total: order.total,
      payment_id: order.paymentId || null,
      timestamp: order.timestamp,
      restaurant_name: order.restaurantName,
      restaurant_id: order.restaurantId,
      status: order.status,
      driver: order.driver || null,
    });
    writeLocalOrders(orders);
    return order;
  }

  await query(
    `INSERT INTO app_orders (
      id, customer_id, customer_name, customer_phone, customer_address, items, item_amount, total, payment_id, timestamp, restaurant_name, restaurant_id, status, driver
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      order.id,
      order.customerId || null,
      order.customerName,
      order.customerPhone,
      order.customerAddress || null,
      order.items,
      order.itemAmount,
      order.total,
      order.paymentId || null,
      order.timestamp,
      order.restaurantName,
      order.restaurantId,
      order.status,
      order.driver || null,
    ]
  );

  return order;
}

export async function getOrdersByCustomer(customerKey: string) {
  const normalizedCustomerKey = String(customerKey || "").replace(/\D/g, "");
  if (!isDatabaseConfigured()) {
    const users = readLocalUsers();
    const user = users.find((u) => u.id === customerKey || u.phone === normalizedCustomerKey);
    const phone = user?.phone || normalizedCustomerKey || undefined;
    return readLocalOrders()
      .filter((o) => o.customer_id === customerKey || o.customer_id === normalizedCustomerKey || (phone ? o.customer_phone === phone : false))
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .map((o) => normalizeLocalOrder(o));
  }

  const result = await query<AppOrder>(
    `SELECT * FROM app_orders WHERE customer_id = $1 OR customer_phone = $1 OR customer_phone = (SELECT phone FROM app_users WHERE id = $1) ORDER BY timestamp DESC`,
    [customerKey]
  );
  return result.rows;
}

export async function getOrdersByRestaurant(restaurantId?: number) {
  if (!isDatabaseConfigured()) {
    return readLocalOrders()
      .filter((o) => (restaurantId ? Number(o.restaurant_id) === restaurantId : true))
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .map((o) => normalizeLocalOrder(o))
      .slice(0, 100);
  }

  const result = restaurantId
    ? await query<AppOrder>(`SELECT * FROM app_orders WHERE restaurant_id = $1 ORDER BY timestamp DESC LIMIT 100`, [restaurantId])
    : await query<AppOrder>(`SELECT * FROM app_orders ORDER BY timestamp DESC LIMIT 100`);
  return result.rows;
}

export async function getOrderById(orderId: string) {
  if (!isDatabaseConfigured()) {
    const order = readLocalOrders().find((o) => o.id === orderId);
    return order ? normalizeLocalOrder(order) : null;
  }

  const result = await query<AppOrder>(`SELECT * FROM app_orders WHERE id = $1 LIMIT 1`, [orderId]);
  return result.rows[0] || null;
}

export async function updateOrder(orderId: string, changes: { status?: string; driver?: string | null }) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (changes.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(changes.status);
  }
  if (changes.driver !== undefined) {
    fields.push(`driver = $${fields.length + 1}`);
    values.push(changes.driver);
  }

  if (fields.length === 0) return;
  values.push(orderId);
  if (!isDatabaseConfigured()) {
    const orders = readLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      orders[idx] = { ...orders[idx], ...(changes.status !== undefined ? { status: changes.status } : {}), ...(changes.driver !== undefined ? { driver: changes.driver } : {}) };
      writeLocalOrders(orders);
    }
    return;
  }

  await query(`UPDATE app_orders SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
}

function normalizeLocalOrder(order: Record<string, any>): AppOrder {
  return {
    id: String(order.id),
    customer_id: order.customer_id ?? null,
    customer_name: String(order.customer_name ?? ""),
    customer_phone: String(order.customer_phone ?? ""),
    customer_address: order.customer_address ?? null,
    items: String(order.items ?? ""),
    item_amount: Number(order.item_amount ?? 0),
    total: Number(order.total ?? 0),
    payment_id: order.payment_id ?? null,
    timestamp: Number(order.timestamp ?? Date.now()),
    restaurant_name: String(order.restaurant_name ?? ""),
    restaurant_id: Number(order.restaurant_id ?? 0),
    status: String(order.status ?? "pending"),
    driver: order.driver ?? null,
  };
}
