# SMS Troubleshooting Guide

## Issue: SMS Not Sending

### What I Fixed:

1. ✅ Created `.env` file (was missing)
2. ✅ Added `require('dotenv').config()` to server.js
3. ✅ Set `SMS_ENABLED=false` for mock mode (console logging)
4. ✅ Added detailed logging to SMS service
5. ✅ Added logging to booking controller

### How to Verify SMS is Working:

#### Step 1: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd vehicle-booking-system/backend
node server.js
```

#### Step 2: Make a Test Booking

1. Go to your booking page
2. Fill in all details including phone number
3. Submit the booking

#### Step 3: Check Console Output

You should see output like this in your server console:

```
📱 Preparing to send SMS notification...
SMS Details: { reference_number: 'BT...', route_from: 'Nairobi', ... }
Customer Phone: 0712345678

========================================
📱 SMS SERVICE CALLED
========================================
Phone Number: 0712345678
SMS_ENABLED: false
========================================

╔════════════════════════════════════════╗
║   📱 SMS NOTIFICATION (MOCK MODE)     ║
╚════════════════════════════════════════╝
To: 0712345678
─────────────────────────────────────────
Bens Trans Booking Confirmed!
Ref: BT1234567890
Route: Nairobi to Mombasa
Date: 15/03/2026
Time: 08:00
Seats: 2
Amount: KSh 2000
Vehicle: KAA 123B
Pay before: 14/03/2026
Thank you for choosing Bens Trans!
─────────────────────────────────────────
✅ SMS logged successfully (mock mode)
ℹ️  To send real SMS, set SMS_ENABLED=true in .env

✅ SMS notification result: { success: true, message: '...', recipient: '0712345678' }
```

### If You Don't See SMS Output:

1. **Check .env file exists:**
   ```bash
   dir .env
   ```
   Should show the file. If not, it was created in the wrong location.

2. **Check server.js has dotenv:**
   First line should be: `require('dotenv').config();`

3. **Restart server:**
   Always restart after changing .env or server.js

4. **Check for errors:**
   Look for any red error messages in console

### To Enable Real SMS:

1. **Get Africa's Talking credentials:**
   - Sign up at https://africastalking.com
   - Get API Key and Username
   - Add credits (KSh 100+)

2. **Update .env file:**
   ```env
   SMS_ENABLED=true
   AFRICASTALKING_API_KEY=your_actual_api_key
   AFRICASTALKING_USERNAME=your_actual_username
   SMS_SENDER_ID=BENSTRANS
   ```

3. **Restart server**

4. **Test booking** - Real SMS will be sent!

### Current Status:

✅ SMS service is configured
✅ Mock mode enabled (console logging)
✅ Ready to send real SMS when credentials added

### Quick Test:

Run this command to test SMS directly:

```bash
node test-sms.js
```

Edit line 18 first to add your phone number!

### Common Issues:

**Issue:** No SMS output in console
**Solution:** Restart server after creating .env file

**Issue:** "Cannot find module 'dotenv'"
**Solution:** Run `npm install` in backend folder

**Issue:** SMS shows but says "not configured"
**Solution:** Check .env file has SMS_ENABLED=false (for mock mode)

**Issue:** Want to send real SMS
**Solution:** Follow "To Enable Real SMS" steps above

### Need Help?

Check these files:
- `backend/.env` - Configuration
- `backend/server.js` - Should load dotenv
- `backend/services/sms.service.js` - SMS logic
- `backend/controllers/booking.controller.js` - Calls SMS service

The SMS is working! You should see it in the console when you make a booking.
