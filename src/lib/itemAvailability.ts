export function normalizeMenuItemName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\((half|full)\)\s*$/i, "")
    .replace(/\s*\(\d+\s*pcs?\)\s*$/i, "");
}

export function isItemListedOutOfStock(itemName: string, outOfStockItems: string[]) {
  const normalizedItemName = normalizeMenuItemName(itemName);

  return outOfStockItems.some((outOfStockItem) => {
    const normalizedOutOfStockItem = normalizeMenuItemName(outOfStockItem);
    return Boolean(normalizedOutOfStockItem) && normalizedOutOfStockItem === normalizedItemName;
  });
}
