import crypto from "crypto";
import bcrypt from "bcryptjs";
import { isDatabaseConfigured, query } from "@/src/lib/db";
import { readLocalUsers, writeLocalUsers } from "@/src/lib/localStore";

export type UserRole = "customer" | "owner" | "delivery";

export type AppUser = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  created_at: string | number;
  disabled_at?: string | number | null;
  disabled_reason?: string | null;
};

type DbUserRow = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  password_hash: string;
  created_at: string | number;
  reset_token_hash: string | null;
  reset_token_expires_at: string | number | null;
  disabled_at?: string | number | null;
  disabled_reason?: string | null;
};

type SessionRow = {
  token: string;
  user_id: string;
  created_at: string | number;
  expires_at: string | number;
};

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_TOKEN_MAX_AGE_MS = 1000 * 60 * 30;

type LocalSessionPayload = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
  user?: AppUser;
};

type SeedUser = { role: UserRole; name: string; phone: string; password: string };

const DEFAULT_SESSION_COOKIE_NAME = "quickmart_session";
const ROLE_SESSION_COOKIE_NAMES: Record<UserRole, string> = {
  customer: "quickmart_customer_session",
  owner: "quickmart_owner_session",
  delivery: "quickmart_delivery_session",
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET or SESSION_SECRET is required in production");
  }
  return "quickmart-session-secret";
}

function encodeBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signSessionPayload(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function createLocalSessionToken(payload: LocalSessionPayload) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = signSessionPayload(body);
  return `v1.${body}.${signature}`;
}

function readLocalSessionToken(token: string): LocalSessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const [, body, signature] = parts;
  const expectedSignature = signSessionPayload(body);
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as LocalSessionPayload;
    if (!payload.expiresAt || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

function mapUser(row: DbUserRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    created_at: row.created_at,
    disabled_at: row.disabled_at ?? null,
    disabled_reason: row.disabled_reason ?? null,
  };
}

export function isUserDisabled(user: Pick<AppUser, "disabled_at"> | null | undefined) {
  return Boolean(user?.disabled_at);
}

function parseDeliverySeedsFromEnv(): SeedUser[] {
  const jsonSeeds = process.env.DELIVERY_USERS_JSON;
  if (jsonSeeds) {
    try {
      const parsed = JSON.parse(jsonSeeds) as Array<{ name?: string; phone?: string; password?: string }>;
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry, index) => ({
            role: "delivery" as const,
            name: String(entry.name || `Delivery Boy ${index + 1}`),
            phone: String(entry.phone || ""),
            password: String(entry.password || ""),
          }))
          .filter((entry) => entry.phone && entry.password);
      }
    } catch {
      console.warn("Invalid DELIVERY_USERS_JSON. Expected an array of delivery user objects.");
    }
  }

  return (process.env.DELIVERY_USERS || "")
    .split(",")
    .map((entry, index) => {
      const [name, phone, password] = entry.split("|").map((part) => part.trim());
      return {
        role: "delivery" as const,
        name: name || `Delivery Boy ${index + 1}`,
        phone: phone || "",
        password: password || "",
      };
    })
    .filter((entry) => entry.phone && entry.password);
}

export async function ensureSeedUsers() {
  const seeds: SeedUser[] = [
    {
      role: "owner",
      name: process.env.DEFAULT_OWNER_NAME || "Restaurant Owner",
      phone: process.env.DEFAULT_OWNER_PHONE || "9000000001",
      password: process.env.DEFAULT_OWNER_PASSWORD || "owner1234",
    },
    {
      role: "delivery",
      name: process.env.DEFAULT_DELIVERY_NAME || "Delivery Boy",
      phone: process.env.DEFAULT_DELIVERY_PHONE || "9000000002",
      password: process.env.DEFAULT_DELIVERY_PASSWORD || "delivery1234",
    },
    ...parseDeliverySeedsFromEnv(),
  ];

  for (const seed of seeds) {
    const exists = await findUserByPhone(seed.phone, seed.role);
    if (!exists) {
      await createUser({
        name: seed.name,
        phone: seed.phone,
        password: seed.password,
        role: seed.role,
      });
    }
  }
}

export async function createUser(input: { name: string; phone: string; password: string; role: UserRole }) {
  const normalizedPhone = normalizePhone(input.phone);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = `user_${crypto.randomUUID()}`;
  const createdAt = Date.now();

  if (!isDatabaseConfigured()) {
    const users = readLocalUsers();
    const existing = users.find((u) => u.phone === normalizedPhone && u.role === input.role);
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        phone: existing.phone,
        role: existing.role as UserRole,
        created_at: existing.created_at,
        disabled_at: existing.disabled_at ?? null,
        disabled_reason: existing.disabled_reason ?? null,
      } as AppUser;
    }
    users.push({
      id,
      name: input.name.trim(),
      phone: normalizedPhone,
      role: input.role,
      password_hash: passwordHash,
      created_at: createdAt,
      reset_token_hash: null,
      reset_token_expires_at: null,
      disabled_at: null,
      disabled_reason: null,
    });
    writeLocalUsers(users);
    return { id, name: input.name.trim(), phone: normalizedPhone, role: input.role, created_at: createdAt } satisfies AppUser;
  }
  try {
    await query(
      `INSERT INTO app_users (id, name, phone, role, password_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, input.name.trim(), normalizedPhone, input.role, passwordHash, createdAt]
    );

    return { id, name: input.name.trim(), phone: normalizedPhone, role: input.role, created_at: createdAt } satisfies AppUser;
  } catch (err) {
    // If the insert failed due to a unique constraint (concurrent seed), return the existing user
    const existing = await findUserByPhone(normalizedPhone, input.role);
    if (existing) return existing;
    throw err;
  }
}

export async function findUserByPhone(phone: string, role?: UserRole) {
  const normalizedPhone = normalizePhone(phone);
  if (!isDatabaseConfigured()) {
    const user = readLocalUsers().find((entry) => entry.phone === normalizedPhone && (!role || entry.role === role));
    return user
      ? ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role as UserRole,
          created_at: user.created_at,
          disabled_at: user.disabled_at ?? null,
          disabled_reason: user.disabled_reason ?? null,
        } as AppUser)
      : null;
  }

  const result = role
    ? await query<DbUserRow>(
        `SELECT * FROM app_users WHERE phone = $1 AND role = $2 LIMIT 1`,
        [normalizedPhone, role]
      )
    : await query<DbUserRow>(`SELECT * FROM app_users WHERE phone = $1 LIMIT 1`, [normalizedPhone]);

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function listUsers() {
  if (!isDatabaseConfigured()) {
    return readLocalUsers()
      .map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role as UserRole,
        created_at: user.created_at,
        disabled_at: user.disabled_at ?? null,
        disabled_reason: user.disabled_reason ?? null,
      }))
      .sort((a, b) => Number(b.created_at) - Number(a.created_at));
  }

  const result = await query<DbUserRow>(
    `SELECT id, name, phone, role, password_hash, created_at, reset_token_hash, reset_token_expires_at, disabled_at, disabled_reason
     FROM app_users
     ORDER BY created_at DESC`
  );

  return result.rows.map(mapUser);
}

export async function setUserDisabled(userId: string, disabled: boolean, reason?: string | null) {
  const disabledAt = disabled ? Date.now() : null;
  const disabledReason = disabled ? reason || "Disabled by owner" : null;

  if (!isDatabaseConfigured()) {
    const users = readLocalUsers();
    const idx = users.findIndex((user) => user.id === userId);
    if (idx < 0) return null;

    users[idx] = {
      ...users[idx],
      disabled_at: disabledAt,
      disabled_reason: disabledReason,
    };
    writeLocalUsers(users);

    const updated = users[idx];
    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      role: updated.role as UserRole,
      created_at: updated.created_at,
      disabled_at: updated.disabled_at ?? null,
      disabled_reason: updated.disabled_reason ?? null,
    } satisfies AppUser;
  }

  const result = await query<DbUserRow>(
    `UPDATE app_users
     SET disabled_at = $1, disabled_reason = $2
     WHERE id = $3
     RETURNING *`,
    [disabledAt, disabledReason, userId]
  );

  if (!result.rows[0]) return null;
  if (disabled) {
    await query(`DELETE FROM app_sessions WHERE user_id = $1`, [userId]);
  }
  return mapUser(result.rows[0]);
}

export async function verifyPassword(phone: string, password: string, role?: UserRole) {
  const normalizedPhone = normalizePhone(phone);
  if (!isDatabaseConfigured()) {
    const user = readLocalUsers().find((entry) => entry.phone === normalizedPhone && (!role || entry.role === role));
    if (!user) return null;
    if (user.disabled_at) return null;
    const matches = await bcrypt.compare(password, user.password_hash);
    return matches
      ? ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role as UserRole,
          created_at: user.created_at,
          disabled_at: user.disabled_at ?? null,
          disabled_reason: user.disabled_reason ?? null,
        } as AppUser)
      : null;
  }

  const result = role
    ? await query<DbUserRow>(
        `SELECT * FROM app_users WHERE phone = $1 AND role = $2 LIMIT 1`,
        [normalizedPhone, role]
      )
    : await query<DbUserRow>(`SELECT * FROM app_users WHERE phone = $1 LIMIT 1`, [normalizedPhone]);

  const row = result.rows[0];
  if (!row) return null;
  if (row.disabled_at) return null;

  const matches = await bcrypt.compare(password, row.password_hash);
  return matches ? mapUser(row) : null;
}

export async function createSession(userOrId: string | AppUser) {
  const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_AGE_MS;

  if (!isDatabaseConfigured()) {
    return {
      token: createLocalSessionToken({
        userId,
        issuedAt: now,
        expiresAt,
        ...(typeof userOrId === "string" ? {} : { user: userOrId }),
      }),
      expiresAt,
    };
  }

  const token = crypto.randomBytes(32).toString("hex");

  await query(
    `INSERT INTO app_sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)`,
    [token, userId, now, expiresAt]
  );

  return { token, expiresAt };
}

export async function getUserFromSessionToken(token: string) {
  if (!isDatabaseConfigured()) {
    const session = readLocalSessionToken(token);
    if (!session) return null;
    const user = readLocalUsers().find((entry) => entry.id === session.userId);
    if (!user || user.disabled_at) return null;
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role as UserRole,
      created_at: user.created_at,
      disabled_at: user.disabled_at ?? null,
      disabled_reason: user.disabled_reason ?? null,
    } as AppUser;
  }

  const result = await query<SessionRow & DbUserRow>(
    `SELECT s.token, s.user_id, s.created_at, s.expires_at, u.id, u.name, u.phone, u.role, u.password_hash, u.created_at, u.reset_token_hash, u.reset_token_expires_at, u.disabled_at, u.disabled_reason
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > $2
     LIMIT 1`,
    [token, Date.now()]
  );

  const row = result.rows[0];
  if (row?.disabled_at) return null;
  return row ? mapUser(row) : null;
}

function escapeCookieName(name: string) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCookieValue(cookieHeader: string, name: string) {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapeCookieName(name)}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookieName(role?: UserRole) {
  return role ? ROLE_SESSION_COOKIE_NAMES[role] : DEFAULT_SESSION_COOKIE_NAME;
}

export async function getUserFromRequest(request: Request, expectedRole?: UserRole) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieNames = expectedRole
    ? [sessionCookieName(expectedRole), DEFAULT_SESSION_COOKIE_NAME]
    : [
        sessionCookieName("customer"),
        sessionCookieName("delivery"),
        sessionCookieName("owner"),
        DEFAULT_SESSION_COOKIE_NAME,
      ];

  for (const cookieName of cookieNames) {
    const token = getCookieValue(cookieHeader, cookieName);
    if (!token) continue;

    const user = await getUserFromSessionToken(token);
    if (!user) continue;
    if (expectedRole && user.role !== expectedRole) continue;
    return user;
  }

  return null;
}

export async function authenticate(phone: string, password: string, role?: UserRole) {
  return verifyPassword(phone, password, role);
}

export async function deleteSession(token: string) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await query(`DELETE FROM app_sessions WHERE token = $1`, [token]);
}

export async function createPasswordResetToken(phone: string, role: UserRole) {
  const user = await findUserByPhone(phone, role);
  if (!user) return null;
  if (isUserDisabled(user)) return null;

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = Date.now() + RESET_TOKEN_MAX_AGE_MS;
  if (!isDatabaseConfigured()) {
    const users = readLocalUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], reset_token_hash: tokenHash, reset_token_expires_at: expiresAt };
      writeLocalUsers(users);
    }
    return { token, user };
  }

  await query(
    `UPDATE app_users SET reset_token_hash = $1, reset_token_expires_at = $2 WHERE id = $3`,
    [tokenHash, expiresAt, user.id]
  );

  return { token, user };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!isDatabaseConfigured()) {
    const users = readLocalUsers();
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u.disabled_at) continue;
      if (!u.reset_token_hash || !u.reset_token_expires_at || u.reset_token_expires_at <= Date.now()) continue;
      if (await bcrypt.compare(token, u.reset_token_hash)) {
        users[i] = { ...u, password_hash: await bcrypt.hash(newPassword, 10), reset_token_hash: null, reset_token_expires_at: null };
        writeLocalUsers(users);
        return { id: u.id, name: u.name, phone: u.phone, role: u.role as UserRole, created_at: u.created_at } as AppUser;
      }
    }
    return null;
  }

  const result = await query<DbUserRow>(
    `SELECT * FROM app_users WHERE reset_token_expires_at > $1 AND reset_token_hash IS NOT NULL`,
    [Date.now()]
  );

  for (const row of result.rows) {
    if (row.reset_token_hash && (await bcrypt.compare(token, row.reset_token_hash))) {
      if (row.disabled_at) return null;
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await query(
        `UPDATE app_users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = $2`,
        [passwordHash, row.id]
      );
      return mapUser(row);
    }
  }

  return null;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  if (!isDatabaseConfigured()) {
    const users = readLocalUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    const user = users[idx];
    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) return false;
    users[idx] = { ...user, password_hash: await bcrypt.hash(newPassword, 10) };
    writeLocalUsers(users);
    return true;
  }

  const result = await query<DbUserRow>(`SELECT * FROM app_users WHERE id = $1 LIMIT 1`, [userId]);
  const user = result.rows[0];
  if (!user) return false;

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) return false;

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query(`UPDATE app_users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
  return true;
}

export async function setAuthCookie(response: Response, token: string) {
  const nextResponse = response instanceof Response ? response : new Response();
  nextResponse.headers.append(
    "Set-Cookie",
    `${DEFAULT_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_MS / 1000}; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
  );
  return nextResponse;
}

export function buildAuthCookie(token: string) {
  return `${DEFAULT_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_MS / 1000}; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
}

export function clearAuthCookie() {
  return `${DEFAULT_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
}

export function publicUser(user: AppUser) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
    disabled_at: user.disabled_at ?? null,
    disabled_reason: user.disabled_reason ?? null,
  };
}

export { normalizePhone };
