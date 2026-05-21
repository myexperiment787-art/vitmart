import crypto from "crypto";

export type CustomerAccount = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  createdAt: number;
};

const COOKIE_NAME = "quickmart_customer_accounts";
const COOKIE_SECRET = process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET || "quickmart-session-secret";

function encodeBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", COOKIE_SECRET).update(value).digest("base64url");
}

function serialize(accounts: CustomerAccount[]) {
  const payload = encodeBase64Url(JSON.stringify(accounts));
  return `v1.${payload}.${sign(payload)}`;
}

function parseCookieValue(cookieValue: string | undefined) {
  if (!cookieValue) return [] as CustomerAccount[];
  const parts = cookieValue.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return [] as CustomerAccount[];

  const [, payload, signature] = parts;
  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return [] as CustomerAccount[];
  }

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as CustomerAccount[];
    return Array.isArray(decoded) ? decoded : [];
  } catch {
    return [] as CustomerAccount[];
  }
}

export function readCustomerAccountsFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return parseCookieValue(match ? decodeURIComponent(match[1]) : undefined);
}

export function upsertCustomerAccountCookie(accounts: CustomerAccount[]) {
  return `${COOKIE_NAME}=${encodeURIComponent(serialize(accounts))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
}

export function findCustomerAccountByPhone(request: Request, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  return readCustomerAccountsFromRequest(request).find((account) => account.phone === normalizedPhone) || null;
}

export function verifyCustomerAccount(request: Request, phone: string, passwordHash: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  return readCustomerAccountsFromRequest(request).find((account) => account.phone === normalizedPhone && account.passwordHash === passwordHash) || null;
}
