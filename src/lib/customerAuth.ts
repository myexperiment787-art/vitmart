import crypto from "crypto";
import fs from "fs";
import path from "path";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  createdAt: number;
};

type CustomerSession = {
  token: string;
  customerId: string;
  createdAt: number;
};

function getDataDir() {
  if (process.env.NODE_ENV === "production") {
    return path.join(process.env.TMPDIR || "/tmp", "vitmart-data");
  }

  return path.join(process.cwd(), ".data");
}

const DATA_DIR = getDataDir();
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const SESSIONS_FILE = path.join(DATA_DIR, "customer-sessions.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, value: T) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function createCustomer(name: string, phone: string, password: string): Customer {
  const customers = readJsonFile<Customer[]>(CUSTOMERS_FILE, []);
  const normalizedPhone = normalizePhone(phone);

  if (customers.some((c) => c.phone === normalizedPhone)) {
    throw new Error("Phone number is already registered");
  }

  const customer: Customer = {
    id: `cus_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    phone: normalizedPhone,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };

  customers.push(customer);
  writeJsonFile(CUSTOMERS_FILE, customers);
  return customer;
}

export function verifyCustomer(phone: string, password: string): Customer | null {
  const customers = readJsonFile<Customer[]>(CUSTOMERS_FILE, []);
  const normalizedPhone = normalizePhone(phone);
  const passwordHash = hashPassword(password);

  return customers.find((c) => c.phone === normalizedPhone && c.passwordHash === passwordHash) || null;
}

export function getCustomerById(customerId: string): Customer | null {
  const customers = readJsonFile<Customer[]>(CUSTOMERS_FILE, []);
  return customers.find((c) => c.id === customerId) || null;
}

export function createSession(customerId: string): string {
  const sessions = readJsonFile<CustomerSession[]>(SESSIONS_FILE, []);
  const token = crypto.randomBytes(24).toString("hex");

  sessions.push({
    token,
    customerId,
    createdAt: Date.now(),
  });

  writeJsonFile(SESSIONS_FILE, sessions);
  return token;
}

export function getCustomerFromToken(token: string): Customer | null {
  const sessions = readJsonFile<CustomerSession[]>(SESSIONS_FILE, []);
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  return getCustomerById(session.customerId);
}

export function getTokenFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export function serializeCustomerForClient(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    createdAt: customer.createdAt,
  };
}
