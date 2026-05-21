# Google Sheets Setup for Restaurant Orders

## Overview
Each restaurant has its own Google Sheet that automatically receives order records when:
1. Customer completes payment (order date, name, address, total)
2. Delivery boy is assigned (adds delivery boy name)

## Setup Steps

### 1. Create Google Sheets
Create 4 new Google Sheets for your restaurants:
- **Sheet 1**: Momo House
- **Sheet 2**: Chinese Corner
- **Sheet 3**: Snack Attack
- **Sheet 4**: Fresh Bites

Add column headers to each sheet:
```
A1: Order Date
B1: Customer Name
C1: Items
D1: Delivery Address
E1: Delivery Boy
F1: Total Amount
```

### 2. Create Google Apps Script Webhook

For each sheet, you'll need a Google Apps Script that accepts POST requests:

1. Open Google Sheet → **Extensions** → **Apps Script**
2. Replace the code with:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // If orderId provided, try to find existing row and update instead of appending
    const orderId = data.orderId;
    if (orderId) {
      const values = sheet.getDataRange().getValues();
      const headers = values[0] || [];
      // Try to find a column named 'Order ID'
      let idCol = headers.indexOf('Order ID');
      if (idCol === -1) {
        // if not present, add it as the last column
        idCol = headers.length;
        sheet.getRange(1, idCol + 1).setValue('Order ID');
      }

      for (let r = 1; r < values.length; r++) {
        if (values[r][idCol] && values[r][idCol].toString() === orderId.toString()) {
          // Update columns: Order Date, Customer Name, Items, Delivery Address, Delivery Boy, Total Amount
          sheet.getRange(r + 1, 1, 1, 6).setValues([[
            data.orderDate || new Date().toLocaleString('en-IN'),
            data.customerName || '',
            data.items || '',
            data.deliveryAddress || '',
            data.deliveryBoy || '',
            data.totalAmount || 0
          ]]);
          // Ensure orderId is set in the ID column
          sheet.getRange(r + 1, idCol + 1).setValue(orderId);
          return ContentService.createTextOutput(JSON.stringify({ success: true, updated: true }));
        }
      }
    }

    // Append new row (orderId may be empty)
    sheet.appendRow([
      data.orderDate || new Date().toLocaleString('en-IN'),
      data.customerName || '',
      data.items || '',
      data.deliveryAddress || '',
      data.deliveryBoy || '',
      data.totalAmount || 0,
      data.orderId || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    }));
  }
}
```

3. Click **Deploy** → **New deployment** → Select type: **Web app**
   - Execute as: Your account
   - Who has access: Anyone

4. Copy the **Deployment ID** (the long URL starting with `https://script.google.com/macros/s/...`)

### 3. Add Webhook URLs to `.env.local`

Update your `.env.local` with the 4 webhook URLs:

```env
GOOGLE_SHEET_RESTAURANT_1_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID_1}/exec
GOOGLE_SHEET_RESTAURANT_2_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID_2}/exec
GOOGLE_SHEET_RESTAURANT_3_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID_3}/exec
GOOGLE_SHEET_RESTAURANT_4_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID_4}/exec
```

Replace `{DEPLOYMENT_ID_1}`, etc. with the actual IDs from step 2.

## What Gets Recorded

### When Order is Created (Payment Verified)
- ✅ Order Date (current date/time)
- ✅ Customer Name
- ✅ Delivery Address (from dropdown)
- ✅ Total Amount (including delivery charges)
- ⏳ Delivery Boy (empty, filled later)

### When Delivery Boy is Assigned
- ✅ Delivery Boy name is automatically added to the row

## Testing

1. Place a test order in the app
2. After payment, check the Google Sheet - new row should appear
3. In delivery dashboard, assign a driver
4. The sheet should update with the driver name

## Troubleshooting

- **Deployment URL not working**: Make sure you selected "Anyone" in the permissions
- **Sheet not updating**: Check browser console for errors, verify the webhook URL in `.env.local`
- **Wrong restaurant sheet**: Verify that `restaurantId` matches (1-4) in your checkout
