export type CartItemInput = {
  name?: unknown;
  quantity?: unknown;
  price?: unknown;
};

export type PricedCartItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderPricing = {
  restaurantId: number;
  restaurantName: string;
  items: PricedCartItem[];
  itemAmount: number;
  delivery: number;
  total: number;
};

const foodMenuPrices: Record<string, number> = {
  "Pani Puri (6 pcs)": 20,
  "Spring Roll": 60,
  "Veg Momo (Half)": 50,
  "Veg Momo (Full)": 80,
  "Fried Momo (Half)": 50,
  "Fried Momo (Full)": 80,
  "Paneer Momo (Half)": 60,
  "Paneer Momo (Full)": 90,
  "Chilli Potato (Half)": 50,
  "Chilli Potato (Full)": 80,
  "French Fries (Half)": 30,
  "French Fries (Full)": 50,
  "Chowmein (Half)": 50,
  "Chowmein (Full)": 70,
  "Manchurian (Half)": 50,
  "Manchurian (Full)": 70,
};

const restaurantCatalog: Record<number, { name: string; menu: Record<string, number> }> = {
  1: {
    name: "Momo House",
    menu: {
      "Veg Momo (8 pcs)": 60,
      "Fried Momo (8 pcs)": 70,
      "Paneer Momo (8 pcs)": 80,
      "Tandoori Momo (8 pcs)": 90,
      "Momo Soup": 50,
    },
  },
  2: {
    name: "Chinese Corner",
    menu: {
      "Chowmein (Half)": 30,
      "Chowmein (Full)": 50,
      "Manchurian (Half)": 30,
      "Manchurian (Full)": 50,
      "Fried Rice": 50,
      "Spring Roll (2 pcs)": 40,
    },
  },
  3: {
    name: "Snack Attack",
    menu: {
      "French Fries (Half)": 20,
      "French Fries (Full)": 40,
      "Chilli Potato (Half)": 30,
      "Chilli Potato (Full)": 50,
      "Pani Puri (6 pcs)": 30,
      "Chaat Papdi": 40,
      "Samosa (2 pcs)": 25,
      "Aloo Tikki (2 pcs)": 35,
    },
  },
  4: {
    name: "Fresh Bites",
    menu: {
      "Fruit Bowl": 60,
      "Bhel Puri": 35,
      "Dahi Puri (6 pcs)": 50,
      "Veg Sandwich": 40,
      "Corn Cup": 30,
    },
  },
};

function normalizeItemName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function priceMap(menu: Record<string, number>) {
  return new Map(Object.entries(menu).map(([name, price]) => [normalizeItemName(name), { name, price }]));
}

function restaurantIdValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

function quantityValue(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
}

function assertClientTotal(clientTotal: unknown, serverTotal: number) {
  const parsed = Number(clientTotal);
  if (!Number.isFinite(parsed)) return;
  if (Math.round(parsed) !== serverTotal) {
    throw new Error("Order total does not match the server menu price");
  }
}

export function calculateOrderPricing(
  cartItems: unknown,
  restaurantIdInput?: unknown,
  clientTotal?: unknown
): OrderPricing {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }
  if (cartItems.length > 50) {
    throw new Error("Cart has too many items");
  }

  const restaurantId = restaurantIdValue(restaurantIdInput);
  const catalog = restaurantId ? restaurantCatalog[restaurantId] : { name: "Quick Mart Food", menu: foodMenuPrices };
  if (!catalog) {
    throw new Error("Invalid restaurant");
  }

  const menu = priceMap(catalog.menu);
  const items: PricedCartItem[] = [];
  let itemAmount = 0;
  let totalQuantity = 0;

  for (const rawItem of cartItems as CartItemInput[]) {
    const requestedName = String(rawItem?.name || "").trim();
    const menuItem = menu.get(normalizeItemName(requestedName));
    if (!menuItem) {
      throw new Error(`Invalid menu item: ${requestedName || "unknown"}`);
    }

    const quantity = quantityValue(rawItem?.quantity);
    if (quantity < 1 || quantity > 20) {
      throw new Error(`Invalid quantity for ${menuItem.name}`);
    }

    const clientPrice = Number(rawItem?.price);
    if (Number.isFinite(clientPrice) && Math.round(clientPrice) !== menuItem.price) {
      throw new Error(`Invalid price for ${menuItem.name}`);
    }

    totalQuantity += quantity;
    if (totalQuantity > 100) {
      throw new Error("Cart quantity is too large");
    }

    items.push({ name: menuItem.name, quantity, price: menuItem.price });
    itemAmount += menuItem.price * quantity;
  }

  const delivery = restaurantId ? (itemAmount >= 200 ? 0 : 20) : itemAmount >= 70 ? 0 : 10;
  const total = itemAmount + delivery;
  assertClientTotal(clientTotal, total);

  return {
    restaurantId,
    restaurantName: catalog.name,
    items,
    itemAmount,
    delivery,
    total,
  };
}
