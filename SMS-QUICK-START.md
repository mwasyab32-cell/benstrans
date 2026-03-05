# SMS Quick Start Guide

Get SMS notifications working in 5 minutes!

## Quick Setup Steps

### 1. Install Africa's Talking Package

```bash
cd vehicle-booking-system/backend
npm install africastalking
```

### 2. Get Your Credentials

1. Sign up at [https://africastalking.com](https://africastalking.com)
2. Go to Settings → API Key
3. Copy your **API Key** and **Username**

### 3. Configure Environment

Edit `backend/.env` file and add:

```env
SMS_ENABLED=true
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_USERNAME=your_username_here
SMS_SENDER_ID=BENSTRANS
```

### 4. Add Credits

1. Go to Billing in Africa's Talking dashboard
2. Add at least KSh 100 for testing
3. SMS costs ~KSh 0.80 each in Kenya

### 5. Test It!

```bash
# Edit test-sms.js and replace the test phone number with yours
# Line 18: const testPhone = '0712345678';

# Run the test
node test-sms.js
```

You should receive 3 SMS messages on your phone!

## For Testing (No Real SMS)

If you want to test without sending real SMS:

```env
SMS_ENABLED=false
```

SMS will be logged to console instead.

## What Happens Now?

✅ Customers receive SMS when they book
✅ SMS includes booking reference, route, date, time, amount
✅ Automatic phone number formatting (+254)
✅ Non-blocking (booking succeeds even if SMS fails)

## Need Help?

See `SMS-INTEGRATION-GUIDE.md` for detailed instructions.

## Cost

- Kenya: ~KSh 0.80 per SMS
- 100 bookings = ~KSh 80
- 1000 bookings = ~KSh 800

Very affordable! 🎉
