# SMS Integration Guide - Africa's Talking

This guide will help you set up SMS notifications for booking confirmations using Africa's Talking SMS gateway.

## Overview

The system sends SMS notifications to customers when:
- A booking is successfully created
- Payment is confirmed (optional)
- Payment reminders (optional)

## Step 1: Create Africa's Talking Account

1. Go to [https://africastalking.com](https://africastalking.com)
2. Click "Sign Up" and create an account
3. Verify your email address
4. Complete your profile

## Step 2: Get API Credentials

1. Log in to your Africa's Talking dashboard
2. Go to **Settings** → **API Key**
3. Generate a new API key (save it securely)
4. Note your **Username** (usually shown in the dashboard)

## Step 3: Add Credits

1. Go to **Billing** in your dashboard
2. Add credits to your account (SMS costs vary by country)
3. For Kenya: ~KSh 0.80 per SMS

## Step 4: Configure Sender ID (Optional)

1. Go to **SMS** → **Sender IDs**
2. Request a custom sender ID (e.g., "BENSTRANS")
3. Wait for approval (usually 1-2 business days)
4. Until approved, use the default sender ID

## Step 5: Install Africa's Talking SDK

In your backend directory, install the package:

```bash
cd vehicle-booking-system/backend
npm install africastalking
```

## Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Edit your `.env` file and add:
   ```env
   # SMS Configuration
   SMS_ENABLED=true
   AFRICASTALKING_API_KEY=your_actual_api_key_here
   AFRICASTALKING_USERNAME=your_username_here
   SMS_SENDER_ID=BENSTRANS
   ```

3. Replace the placeholder values:
   - `AFRICASTALKING_API_KEY`: Your API key from Step 2
   - `AFRICASTALKING_USERNAME`: Your username from Step 2
   - `SMS_SENDER_ID`: Your approved sender ID or leave as default

## Step 7: Test SMS Functionality

1. Restart your backend server:
   ```bash
   node server.js
   ```

2. Create a test booking through your system

3. Check the console logs for SMS status

4. Verify the SMS was received on the customer's phone

## Testing in Sandbox Mode

For testing without spending credits:

1. Set `SMS_ENABLED=false` in your `.env` file
2. SMS will be logged to console instead of sent
3. Perfect for development and testing

## SMS Message Format

### Booking Confirmation
```
Bens Trans Booking Confirmed!
Ref: BT1234567890
Route: Nairobi to Mombasa
Date: 03/02/2026
Time: 08:00:00
Seats: 2
Amount: KSh 2000
Vehicle: KAA 123B
Pay before: 02/02/2026
Thank you for choosing Bens Trans!
```

### Payment Confirmation
```
Bens Trans Payment Received!
Receipt: ABC123XYZ
Amount: KSh 2000
Ref: BT1234567890
Your booking is confirmed. Safe travels!
```

## Phone Number Format

The system automatically formats phone numbers:
- Input: `0712345678` → Output: `+254712345678`
- Input: `254712345678` → Output: `+254712345678`
- Input: `+254712345678` → Output: `+254712345678`

## Cost Estimation

**Kenya SMS Rates (approximate):**
- Local SMS: ~KSh 0.80 per message
- 1000 bookings = ~KSh 800 in SMS costs

**Recommended Credits:**
- Start with KSh 1,000 - 5,000 depending on expected volume
- Set up auto-recharge to avoid service interruption

## Troubleshooting

### SMS Not Sending

1. **Check credentials:**
   ```bash
   # Verify .env file has correct values
   cat .env | grep SMS
   ```

2. **Check account balance:**
   - Log in to Africa's Talking dashboard
   - Verify you have sufficient credits

3. **Check logs:**
   ```bash
   # Look for SMS errors in console
   node server.js
   ```

4. **Verify phone number format:**
   - Must be valid Kenyan number
   - System auto-formats to +254 format

### Common Errors

**Error: "Insufficient Balance"**
- Solution: Add credits to your Africa's Talking account

**Error: "Invalid Phone Number"**
- Solution: Ensure phone number is 10 digits (e.g., 0712345678)

**Error: "Invalid Sender ID"**
- Solution: Use default sender ID or wait for custom ID approval

## Production Checklist

Before going live:

- [ ] Africa's Talking account created and verified
- [ ] API credentials added to `.env` file
- [ ] SMS credits added to account
- [ ] Custom sender ID approved (optional)
- [ ] `SMS_ENABLED=true` in production `.env`
- [ ] Test SMS sent successfully
- [ ] Auto-recharge configured (recommended)
- [ ] Monitoring set up for SMS failures

## Support

**Africa's Talking Support:**
- Email: support@africastalking.com
- Phone: +254 20 524 2223
- Docs: https://developers.africastalking.com

**System Issues:**
- Check `backend/services/sms.service.js`
- Review console logs for errors
- Verify environment variables are set

## Alternative SMS Gateways

If you prefer a different provider, you can modify `backend/services/sms.service.js`:

**Other Options:**
- Twilio (international)
- Infobip (Kenya)
- BulkSMS Kenya
- Movesms

The service is designed to be easily adaptable to any SMS gateway.
