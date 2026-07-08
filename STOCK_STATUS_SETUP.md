# 📦 Out of Stock Feature Setup Guide

## Overview
This feature allows you to manage item availability directly from a Google Sheet, just like the shop status feature.

---

## Step 1: Create a Google Sheet with Out of Stock Items

1. **Create a new Google Sheet** or use an existing one
2. **Add the following columns:**
   - Column A: `outOfStockItems`
   
3. **Add out-of-stock item names** in rows below the header:
   ```
   outOfStockItems
   Pani Puri (6 pcs)
   Paneer Momo
   Manchurian
   Veg Momo
   ```

4. **Important:** Item names in the sheet MUST match exactly with the names in your `food/page.tsx` file, including:
   - Spaces
   - Punctuation
   - Capitalization

---

## Step 2: Create a Google Apps Script to Expose Data

1. **Open your Google Sheet**
2. **Click:** Extensions → Apps Script
3. **Replace all code** with this:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const outOfStockItems = [];

  data.forEach(function(row) {
    row.forEach(function(cell) {
      const value = cell ? cell.toString().trim() : "";
      const key = value.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (
        value &&
        key !== "outofstockitems" &&
        key !== "shopstatus" &&
        key !== "status" &&
        key !== "open" &&
        key !== "closed"
      ) {
        outOfStockItems.push(value);
      }
    });
  });

  return ContentService
    .createTextOutput(JSON.stringify({
      outOfStockItems: outOfStockItems,
      values: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. **Deploy the script:**
   - Click "Deploy" button
   - Select "New Deployment"
   - Type: Choose "Web app"
   - Execute as: Your email
   - Who has access: "Anyone"
   - Click "Deploy"

5. **Copy the deployment URL** (it will look like):
   ```
   https://script.google.com/macros/d/xxxxxxxxxxxxx/useweb
   ```

---

## Step 3: Add Environment Variable

1. **Open `.env.local`** file in your project root
2. **Add this line:**
   ```env
   GOOGLE_STOCK_SHEET_URL=https://script.google.com/macros/d/xxxxxxxxxxxxx/useweb
   ```
   (Replace with your actual deployment URL)

3. **Save the file**

---

## Step 4: How It Works

## Shop Status Setup

For the shop open/closed sheet, use a cell named `SHOP_STATUS` and put `OPEN` or `CLOSED` either beside it or below it.

Apps Script:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  let status = "OPEN";

  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      const key = data[row][col] ? data[row][col].toString().trim().toUpperCase() : "";
      if (key === "SHOP_STATUS") {
        const right = data[row][col + 1] ? data[row][col + 1].toString().trim().toUpperCase() : "";
        const below = data[row + 1] && data[row + 1][col] ? data[row + 1][col].toString().trim().toUpperCase() : "";
        status = right === "CLOSED" || below === "CLOSED" ? "CLOSED" : "OPEN";
      }
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: status, values: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Add the deployed web app URL to `.env.local`:

```env
NEXT_PUBLIC_SHOP_STATUS_URL=https://script.google.com/macros/s/xxxxxxxxxxxxx/exec
```

**Frontend:**
- Every 30 seconds, your app checks `/api/stock-status` endpoint
- The endpoint fetches data from your Google Sheet via the Apps Script URL
- Items listed in the sheet are marked as "Out of Stock"
- A banner displays all out-of-stock items
- Users cannot add out-of-stock items to their cart

**To update out-of-stock items:**
1. Open your Google Sheet
2. Add or remove item names in the `outOfStockItems` column
3. Within 30 seconds, the changes will appear on your website
4. Out-of-stock items will show:
   - ❌ "Out of Stock" badge
   - Reduced opacity
   - Alert when trying to add to cart

---

## Item Names Reference

Keep this list of exact names to copy-paste into your Google Sheet:

✅ **Half & Full Items:**
- Veg Momo
- Fried Momo
- Paneer Momo
- Chilli Potato
- French Fries
- Chowmein
- Manchurian

✅ **Single Price Items:**
- Pani Puri (6 pcs)
- Spring Roll

---

## Testing

1. **Add an item name** to your Google Sheet's `outOfStockItems` column
2. **Wait up to 30 seconds** (or refresh the page)
3. **Verify:**
   - ✅ Item shows as "Out of Stock" with ❌ badge
   - ✅ Item appears in the orange banner
   - ✅ "Add to Cart" button is disabled
   - ✅ Alert appears if trying to add it

---

## Troubleshooting

### Items not updating?
- ✅ Check that `GOOGLE_STOCK_SHEET_URL` is in `.env.local`
- ✅ Verify the deployment URL is correct
- ✅ Check browser console for errors (F12 → Console)

### Item names not matching?
- ✅ Copy exact names from your code
- ✅ Check for extra spaces or different capitalization
- ✅ Google Sheet column must be named exactly `outOfStockItems`

### Not seeing the banner?
- ✅ Make sure you added item names to the sheet
- ✅ Refresh the page (sometimes browser cache issues)
- ✅ Check that the item names match exactly

---

## What's Different from Shop Status?

| Feature | Shop Status | Stock Status |
|---------|-------------|--------------|
| Endpoint | `/api/shop-status` | `/api/stock-status` |
| Stops orders | ✅ Yes | ❌ No (just individual items) |
| Environment variable | `NEXT_PUBLIC_SHOP_STATUS_URL` | `GOOGLE_STOCK_SHEET_URL` |
| Data format | `{status: "OPEN"}` | `{outOfStockItems: [...]}` |
| Banner color | 🔴 Red | 🟠 Orange |

---

## Quick Summary

1. ✏️ Create Google Sheet with item names
2. 🔧 Create Google Apps Script to expose data
3. 🚀 Deploy the script & copy URL
4. 📝 Add URL to `.env.local`
5. 🎉 Done! Items will update automatically

Happy coding! 🚀

