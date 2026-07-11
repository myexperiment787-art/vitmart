import crypto from "crypto";
import fs from "fs";
import path from "path";

function getDataDir() {
  if (process.env.NODE_ENV === "production") {
    return path.join(process.env.TMPDIR || "/tmp", "vitmart-data");
  }

  return path.join(process.cwd(), ".data");
}

const DATA_DIR = getDataDir();
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

export type LocalUserRecord = {
  id: string;
  name: string;
  phone: string;
  role: string;
  password_hash: string;
  created_at: number;
  reset_token_hash: string | null;
  reset_token_expires_at: number | null;
  disabled_at?: number | null;
  disabled_reason?: string | null;
};

export type LocalSessionRecord = {
  token: string;
  user_id: string;
  created_at: number;
  expires_at: number;
};

export type LocalOrderRecord = {
  id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  items: string;
  item_amount?: number | null;
  total: number;
  payment_id?: string | null;
  timestamp: number;
  restaurant_name: string;
  restaurant_id: number;
  status: string;
  driver?: string | null;
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, value: T) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function readLocalUsers() {
  return readJsonFile<LocalUserRecord[]>(USERS_FILE, []);
}

export function writeLocalUsers(users: LocalUserRecord[]) {
  writeJsonFile(USERS_FILE, users);
}

export function readLocalSessions() {
  return readJsonFile<LocalSessionRecord[]>(SESSIONS_FILE, []);
}

export function writeLocalSessions(sessions: LocalSessionRecord[]) {
  writeJsonFile(SESSIONS_FILE, sessions);
}

export function readLocalOrders() {
  return readJsonFile<LocalOrderRecord[]>(ORDERS_FILE, []);
}

export function writeLocalOrders(orders: LocalOrderRecord[]) {
  writeJsonFile(ORDERS_FILE, orders);
}

export function createLocalId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
