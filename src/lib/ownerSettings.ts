import fs from "fs";
import path from "path";
import { isDatabaseConfigured, query } from "@/src/lib/db";

export type ShopStatus = "OPEN" | "CLOSED";

type OwnerSettings = {
  shopStatus: ShopStatus;
  restaurantShopStatuses: Record<string, ShopStatus>;
  globalOutOfStockItems: string[];
  restaurantOutOfStockItems: Record<string, string[]>;
};

function getDataDir() {
  if (process.env.NODE_ENV === "production") {
    return path.join(process.env.TMPDIR || "/tmp", "vitmart-data");
  }

  return path.join(process.cwd(), ".data");
}

const DATA_DIR = getDataDir();
const OWNER_SETTINGS_FILE = path.join(DATA_DIR, "owner-settings.json");
const OWNER_SETTINGS_KEY = "owner-settings";

export function ownerSettingsPersistenceSource() {
  return isDatabaseConfigured() ? "database" : "local-file";
}

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

function defaultOwnerSettings(): OwnerSettings {
  return {
    shopStatus: "OPEN",
    restaurantShopStatuses: {},
    globalOutOfStockItems: [],
    restaurantOutOfStockItems: {},
  };
}

function normalizeShopStatus(status: unknown): ShopStatus {
  return status === "CLOSED" ? "CLOSED" : "OPEN";
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizeStatusRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, status]) => [key, normalizeShopStatus(status)])
  ) as Record<string, ShopStatus>;
}

function normalizeStringArrayRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, items]) => [key, normalizeStringArray(items)])
  ) as Record<string, string[]>;
}

function readLocalOwnerSettings(): OwnerSettings {
  const settings = readJsonFile<Partial<OwnerSettings>>(OWNER_SETTINGS_FILE, defaultOwnerSettings());

  return {
    shopStatus: normalizeShopStatus(settings.shopStatus),
    restaurantShopStatuses: normalizeStatusRecord(settings.restaurantShopStatuses),
    globalOutOfStockItems: normalizeStringArray(settings.globalOutOfStockItems),
    restaurantOutOfStockItems: normalizeStringArrayRecord(settings.restaurantOutOfStockItems),
  };
}

function writeLocalOwnerSettings(settings: OwnerSettings) {
  writeJsonFile(OWNER_SETTINGS_FILE, settings);
}

async function readOwnerSettings(): Promise<OwnerSettings> {
  if (!isDatabaseConfigured()) {
    return readLocalOwnerSettings();
  }

  const result = await query<{ value: Partial<OwnerSettings> }>(
    `SELECT value FROM app_owner_settings WHERE key = $1 LIMIT 1`,
    [OWNER_SETTINGS_KEY]
  );
  const saved = result.rows[0]?.value;
  if (saved) {
    return {
      shopStatus: normalizeShopStatus(saved.shopStatus),
      restaurantShopStatuses: normalizeStatusRecord(saved.restaurantShopStatuses),
      globalOutOfStockItems: normalizeStringArray(saved.globalOutOfStockItems),
      restaurantOutOfStockItems: normalizeStringArrayRecord(saved.restaurantOutOfStockItems),
    };
  }

  const localSettings = readLocalOwnerSettings();
  await writeOwnerSettings(localSettings);
  return localSettings;
}

async function writeOwnerSettings(settings: OwnerSettings) {
  if (!isDatabaseConfigured()) {
    writeLocalOwnerSettings(settings);
    return;
  }

  await query(
    `INSERT INTO app_owner_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [OWNER_SETTINGS_KEY, JSON.stringify(settings), Date.now()]
  );
}

export async function getShopStatus(restaurantId?: number): Promise<ShopStatus> {
  const settings = await readOwnerSettings();
  if (restaurantId && Number.isFinite(restaurantId)) {
    return settings.restaurantShopStatuses[String(restaurantId)] || "OPEN";
  }

  return settings.shopStatus;
}

export async function setShopStatus(status: ShopStatus, restaurantId?: number) {
  const settings = await readOwnerSettings();

  if (restaurantId && Number.isFinite(restaurantId)) {
    settings.restaurantShopStatuses[String(restaurantId)] = status;
    await writeOwnerSettings(settings);
    return settings.restaurantShopStatuses[String(restaurantId)];
  }

  settings.shopStatus = status;
  await writeOwnerSettings(settings);
  return settings.shopStatus;
}

export async function getOutOfStockItems(restaurantId?: number) {
  const settings = await readOwnerSettings();
  const restaurantItems = restaurantId ? settings.restaurantOutOfStockItems[String(restaurantId)] || [] : [];
  return Array.from(new Set([...settings.globalOutOfStockItems, ...restaurantItems]));
}

export async function setGlobalOutOfStockItems(items: string[]) {
  const settings = await readOwnerSettings();
  settings.globalOutOfStockItems = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
  await writeOwnerSettings(settings);
  return settings.globalOutOfStockItems;
}

export async function setRestaurantOutOfStockItems(restaurantId: number, items: string[]) {
  const settings = await readOwnerSettings();
  settings.restaurantOutOfStockItems[String(restaurantId)] = Array.from(
    new Set(items.map((item) => item.trim()).filter(Boolean))
  );
  await writeOwnerSettings(settings);
  return settings.restaurantOutOfStockItems[String(restaurantId)];
}

export async function toggleRestaurantItemAvailability(restaurantId: number, itemName: string, available: boolean) {
  const settings = await readOwnerSettings();
  const key = String(restaurantId);
  const current = new Set(settings.restaurantOutOfStockItems[key] || []);

  if (available) {
    current.delete(itemName);
  } else {
    current.add(itemName);
  }

  settings.restaurantOutOfStockItems[key] = Array.from(current);
  await writeOwnerSettings(settings);
  return settings.restaurantOutOfStockItems[key];
}
