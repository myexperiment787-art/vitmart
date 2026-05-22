/**
 * Helper to post data to restaurant-specific Google Sheets
 */

export const getRestaurantSheetUrl = (restaurantId: number): string | null => {
  const urlMap: { [key: number]: string | undefined } = {
    1: process.env.GOOGLE_SHEET_RESTAURANT_1_URL,
    2: process.env.GOOGLE_SHEET_RESTAURANT_2_URL,
    3: process.env.GOOGLE_SHEET_RESTAURANT_3_URL,
    4: process.env.GOOGLE_SHEET_RESTAURANT_4_URL,
  };

  return urlMap[restaurantId] || null;
};

export const formatOrderDate = (timestamp: number | string | Date = Date.now()) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};

export const postOrderToSheet = async (
  restaurantId: number,
  orderData: {
    orderDate: string;
    customerName: string;
    items?: string;
    deliveryAddress: string;
    deliveryBoy?: string;
    totalAmount: number;
    orderId?: string;
  }
) => {
  const sheetUrl = getRestaurantSheetUrl(restaurantId);
  if (!sheetUrl) {
    console.log(`⚠️ No Google Sheet URL configured for restaurant ${restaurantId}`);
    return;
  }

  try {
    const response = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderData,
        restaurantId,
        timestamp: Date.now(),
      }),
    });

    if (response.ok) {
      console.log(`✅ Order posted to restaurant ${restaurantId} sheet`);
    } else {
      console.error(`⚠️ Failed to post to restaurant sheet: ${response.statusText}`);
    }
  } catch (e) {
    console.error(`⚠️ Error posting to restaurant sheet:`, e);
  }
};
