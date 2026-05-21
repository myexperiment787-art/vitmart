import fs from "fs";
import path from "path";

export type ShopStatus = "OPEN" | "CLOSED";

type OwnerSettings = {
  shopStatus: ShopStatus;
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

function readOwnerSettings(): OwnerSettings {
  return readJsonFile<OwnerSettings>(OWNER_SETTINGS_FILE, {
    shopStatus: "OPEN",
    globalOutOfStockItems: [],
    restaurantOutOfStockItems: {},
  });
}

function writeOwnerSettings(settings: OwnerSettings) {
  writeJsonFile(OWNER_SETTINGS_FILE, settings);
}

export function getShopStatus(): ShopStatus {
  return readOwnerSettings().shopStatus;
}

export function setShopStatus(status: ShopStatus) {
  const settings = readOwnerSettings();
  settings.shopStatus = status;
  writeOwnerSettings(settings);
  return settings.shopStatus;
}

export function getOutOfStockItems(restaurantId?: number) {
  const settings = readOwnerSettings();
  const restaurantItems = restaurantId ? settings.restaurantOutOfStockItems[String(restaurantId)] || [] : [];
  return Array.from(new Set([...settings.globalOutOfStockItems, ...restaurantItems]));
}

export function setGlobalOutOfStockItems(items: string[]) {
  const settings = readOwnerSettings();
  settings.globalOutOfStockItems = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
  writeOwnerSettings(settings);
  return settings.globalOutOfStockItems;
}

export function setRestaurantOutOfStockItems(restaurantId: number, items: string[]) {
  const settings = readOwnerSettings();
  settings.restaurantOutOfStockItems[String(restaurantId)] = Array.from(
    new Set(items.map((item) => item.trim()).filter(Boolean))
  );
  writeOwnerSettings(settings);
  return settings.restaurantOutOfStockItems[String(restaurantId)];
}

export function toggleRestaurantItemAvailability(restaurantId: number, itemName: string, available: boolean) {
  const settings = readOwnerSettings();
  const key = String(restaurantId);
  const current = new Set(settings.restaurantOutOfStockItems[key] || []);

  if (available) {
    current.delete(itemName);
  } else {
    current.add(itemName);
  }

  settings.restaurantOutOfStockItems[key] = Array.from(current);
  writeOwnerSettings(settings);
  return settings.restaurantOutOfStockItems[key];
}
