import { getOutOfStockItems, getShopStatus } from "@/src/lib/ownerSettings";
import { fetchOutOfStockItemsFromSheet, fetchShopStatusFromSheet, mergeOutOfStockItems } from "@/src/lib/googleSheetStatus";
import { isItemListedOutOfStock } from "@/src/lib/itemAvailability";
import type { OrderPricing } from "@/src/lib/orderPricing";

export async function validateOrderAvailability(pricing: OrderPricing) {
  const restaurantId = pricing.restaurantId || undefined;
  const sheetShopStatus = restaurantId ? null : await fetchShopStatusFromSheet();
  const shopStatus = sheetShopStatus || await getShopStatus(restaurantId);

  if (shopStatus === "CLOSED") {
    throw new Error("Shop is currently closed");
  }

  const sheetItems = await fetchOutOfStockItemsFromSheet(restaurantId);
  const outOfStockItems = mergeOutOfStockItems(sheetItems, await getOutOfStockItems(restaurantId));
  const blockedItems = pricing.items.filter((item) => isItemListedOutOfStock(item.name, outOfStockItems));

  if (blockedItems.length > 0) {
    throw new Error(`${blockedItems.map((item) => item.name).join(", ")} is out of stock`);
  }
}
