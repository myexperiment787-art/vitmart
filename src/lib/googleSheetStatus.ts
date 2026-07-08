export type SheetShopStatus = "OPEN" | "CLOSED";

const SHOP_STATUS_URL_ENV_KEYS = [
  "GOOGLE_SHOP_STATUS_URL",
  "SHOP_STATUS_URL",
  "NEXT_PUBLIC_SHOP_STATUS_URL",
  "GOOGLE_SHEET_STATUS_URL",
  "GOOGLE_SHEET_URL",
];

const GLOBAL_STOCK_URL_ENV_KEYS = [
  "GOOGLE_STOCK_SHEET_URL",
  "STOCK_SHEET_URL",
  "NEXT_PUBLIC_STOCK_SHEET_URL",
];

function firstConfiguredEnv(keys: string[]) {
  return keys.map((key) => process.env[key]?.trim()).find(Boolean) || null;
}

function stockUrlEnvKeys(restaurantId?: number) {
  if (!restaurantId || Number.isNaN(restaurantId)) return GLOBAL_STOCK_URL_ENV_KEYS;

  return [
    `GOOGLE_STOCK_SHEET_RESTAURANT_${restaurantId}_URL`,
    `GOOGLE_RESTAURANT_${restaurantId}_STOCK_SHEET_URL`,
    `NEXT_PUBLIC_STOCK_SHEET_RESTAURANT_${restaurantId}_URL`,
    ...GLOBAL_STOCK_URL_ENV_KEYS,
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cellText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function normalizedKey(value: unknown) {
  return cellText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseStatusValue(value: unknown): SheetShopStatus | null {
  const status = cellText(value).toUpperCase();
  if (status === "CLOSED") return "CLOSED";
  if (status === "OPEN") return "OPEN";
  return null;
}

function splitItems(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isIgnoredStockCell(value: unknown) {
  const text = cellText(value);
  if (!text) return true;

  const key = normalizedKey(text);
  return (
    key === "outofstockitems" ||
    key === "outofstockitem" ||
    key === "outofstock" ||
    key === "shopstatus" ||
    key === "status" ||
    key === "open" ||
    key === "closed"
  );
}

function uniqueItems(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const clean = item.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;

    seen.add(key);
    result.push(clean);
  }

  return result;
}

function normalizeRows(value: unknown): unknown[][] | null {
  if (!Array.isArray(value)) return null;
  if (value.every((row) => Array.isArray(row))) return value as unknown[][];
  return [value];
}

function rowsFromGoogleVisualization(value: unknown): unknown[][] | null {
  if (!isRecord(value) || !isRecord(value.table)) return null;

  const cols = Array.isArray(value.table.cols) ? value.table.cols : [];
  const rows = Array.isArray(value.table.rows) ? value.table.rows : [];
  const header = cols.map((col) => (isRecord(col) ? col.label || col.id || "" : ""));
  const dataRows = rows.map((row) => {
    if (!isRecord(row) || !Array.isArray(row.c)) return [];
    return row.c.map((cell) => {
      if (!isRecord(cell)) return "";
      return cell.v ?? cell.f ?? "";
    });
  });

  return header.some((cell) => cellText(cell)) ? [header, ...dataRows] : dataRows;
}

function parseDelimitedRows(text: string) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  rows.push(row);

  return rows.filter((cells) => cells.some((value) => value.trim()));
}

function parseResponseBody(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return "";

  try {
    return JSON.parse(trimmed);
  } catch {
    const googleVisualizationMatch = trimmed.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
    if (googleVisualizationMatch) {
      try {
        return JSON.parse(googleVisualizationMatch[1]);
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }
}

async function fetchSheetData(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Google Sheet request failed with ${response.status}`);
  }

  const text = await response.text();
  return parseResponseBody(text);
}

function statusFromRows(rows: unknown[][]): SheetShopStatus | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      if (normalizedKey(row[colIndex]) !== "shopstatus") continue;

      const sameRowCandidates = row.slice(colIndex + 1);
      const sameColumnCandidates = rows.slice(rowIndex + 1).map((candidateRow) => candidateRow[colIndex]);
      const candidates = [...sameRowCandidates, ...sameColumnCandidates];

      for (const candidate of candidates) {
        const status = parseStatusValue(candidate);
        if (status) return status;
      }
    }
  }

  for (const row of rows) {
    for (const cell of row) {
      const status = parseStatusValue(cell);
      if (status) return status;
    }
  }

  return null;
}

function statusFromData(data: unknown): SheetShopStatus | null {
  const directStatus = parseStatusValue(data);
  if (directStatus) return directStatus;

  const rows = normalizeRows(data) || rowsFromGoogleVisualization(data);
  if (rows) return statusFromRows(rows);

  if (!isRecord(data)) return null;

  for (const [key, value] of Object.entries(data)) {
    const cleanKey = normalizedKey(key);
    if (cleanKey === "status" || cleanKey === "shopstatus") {
      const status = statusFromData(value);
      if (status) return status;
    }
  }

  for (const key of ["values", "data", "rows", "table"]) {
    if (!(key in data)) continue;

    const status = statusFromData(data[key]);
    if (status) return status;
  }

  return null;
}

function stockItemsFromRows(rows: unknown[][]) {
  const items: string[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const value = row[colIndex];
      if (isIgnoredStockCell(value)) continue;

      const text = cellText(value);
      if (!text || /^\d+(\.\d+)?$/.test(text)) continue;

      items.push(text);
    }
  }

  return uniqueItems(items);
}

function stockItemsFromData(data: unknown): string[] {
  if (typeof data === "string") {
    const rows = parseDelimitedRows(data);
    if (rows.length > 1 || rows[0]?.length > 1) return stockItemsFromRows(rows);
    return uniqueItems(splitItems(data).filter((item) => !isIgnoredStockCell(item)));
  }

  const rows = normalizeRows(data) || rowsFromGoogleVisualization(data);
  if (rows) return stockItemsFromRows(rows);

  if (!isRecord(data)) return [];

  for (const [key, value] of Object.entries(data)) {
    const cleanKey = normalizedKey(key);
    if (
      cleanKey === "outofstockitems" ||
      cleanKey === "outofstockitem" ||
      cleanKey === "outofstock" ||
      cleanKey === "items"
    ) {
      return stockItemsFromData(value);
    }
  }

  for (const key of ["values", "data", "rows", "table"]) {
    if (!(key in data)) continue;

    const items = stockItemsFromData(data[key]);
    if (items.length > 0) return items;
  }

  return [];
}

export async function fetchShopStatusFromSheet(): Promise<SheetShopStatus | null> {
  const url = firstConfiguredEnv(SHOP_STATUS_URL_ENV_KEYS);
  if (!url) return null;

  try {
    return statusFromData(await fetchSheetData(url));
  } catch (error) {
    console.error("Failed to fetch shop status from Google Sheet:", error);
    return null;
  }
}

export async function fetchOutOfStockItemsFromSheet(restaurantId?: number): Promise<string[] | null> {
  const url = firstConfiguredEnv(stockUrlEnvKeys(restaurantId));
  if (!url) return null;

  try {
    return stockItemsFromData(await fetchSheetData(url));
  } catch (error) {
    console.error("Failed to fetch stock status from Google Sheet:", error);
    return null;
  }
}

export function mergeOutOfStockItems(...groups: Array<string[] | null | undefined>) {
  return uniqueItems(groups.flatMap((group) => group || []));
}
