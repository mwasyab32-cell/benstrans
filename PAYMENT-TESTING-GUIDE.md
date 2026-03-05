# Payment System Testing Guide - Bens Trans

## 🎯 Quick Start Testing

### 1. **Start the Server**
```bash
cd vehicle-booking-system/backend
node server.js
```

### 2. **Open the Application**
- Navigate to: http://localhost:3000
- Login with test credentials: `client@test.com` / `client123`

### 3. **Test Payment Flow**
1. **Search for vehicles**: Try "Nairobi" to "Mombasa"
2. **Select a vehicle** and choose number of seats
3. **Enter phone number**: Use any Kenyan format (e.g., 0748648015)
4. **Click "Pay Now via M-Pesa"**
5. **Wait for completion**: Mock payment completes automatically in ~10 seconds

## 🧪 Mock Payment System

### **Current Configuration**
- **Environment**: Development (Mock M-Pesa)
- **Auto-completion**: Payments complete automatically in 10 seconds
- **No real money**: Completely safe for testing
- **Real-time updates**: Status updates every 10 seconds

### **What Happens During Mock Payment**
1. **STK Push Simulation**: System simulates sending payment request
2. **Database Logging**: All transactions logged like real M-Pesa
3. **Auto-completion**: Payment automatically succeeds after 10 seconds
4. **Receipt Generation**: Mock receipt numbers generated (e.g., MOCK1770102722713)
5. **Booking Confirmation**: Booking status updated to "paid"

## 📱 Testing Different Scenarios

### ✅ **Successful Payment Flow**
1. Create booking with valid phone number
2. Initiate payment
3. Wait for auto-completion (~10 seconds)
4. Verify booking status changes to "Paid"
5. Check receipt number is displayed

### ✅ **Payment Status Tracking**
- Real-time progress bar during payment
- Status updates every 10 seconds
- Clear success/failure messages
- Receipt display on completion

### ✅ **Booking Management**
- View all bookings with payment status
- Pay for pending bookings
- Cancel unpaid bookings
- Retry failed payments

### ✅ **Edge Cases to Test**
1. **Late Booking**: Try booking less than 24 hours before travel
2. **Multiple Bookings**: Create several bookings and pay for them
3. **Phone Number Formats**: Test different formats (0701234567, 254701234567, +254701234567)
4. **Payment Timeout**: Close browser during payment and reopen to check status

## 🔧 Technical Details

### **Mock Payment Features**
- **Phone Number Validation**: Automatically formats to 254XXXXXXXXX
- **Payment Deadlines**: Enforces 24-hour advance payment rule
- **Transaction Logging**: Complete audit trail in database
- **Callback Simulation**: Mimics real M-Pesa callback processing
- **Receipt Generation**: Creates realistic receipt numbers

### **Database Tables Used**
- `bookings` - Booking records with payment status
- `payments` - Completed payment records
- `mpesa_requests` - STK Push request tracking
- `payment_callbacks` - M-Pesa callback data

### **Payment Status Flow**
```
pending → STK Push sent → waiting for completion → paid
```

## 🚀 Production Deployment

### **Switching to Real M-Pesa**
1. **Get M-Pesa Credentials** from Safaricom
2. **Set Environment Variable**: `NODE_ENV=production`
3. **Configure Real Credentials** in environment variables
4. **Update Callback URL** to public HTTPS endpoint
5. **Test with Small Amounts** before going live

### **Environment Variables Needed**
```env
NODE_ENV=production
MPESA_CONSUMER_KEY=your_real_consumer_key
MPESA_CONSUMER_SECRET=your_real_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_real_passkey
MPESA_BASE_URL=https://api.safaricom.co.ke
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa-callback
```

## 🐛 Troubleshooting

### **Common Issues**

#### **"Payment initiation failed"**
- **Mock System**: Should not happen - check server logs
- **Real System**: Check M-Pesa credentials and network connectivity

#### **Payment stuck in "pending"**
- **Mock System**: Wait up to 15 seconds for auto-completion
- **Real System**: Check M-Pesa callback URL is accessible

#### **"Booking deadline passed"**
- **Solution**: Bookings must be made 24+ hours before travel
- **Fix**: Create trips for future dates or adjust deadline logic

#### **Phone number format errors**
- **Supported Formats**: 0701234567, 254701234567, +254701234567
- **Auto-formatting**: System automatically converts to 254XXXXXXXXX

### **Debug Information**
- **Server Logs**: Check console for detailed payment processing logs
- **Database**: Query `payments` and `mpesa_requests` tables for transaction history
- **Browser Console**: Check for JavaScript errors during payment

## 📊 Testing Checklist

### **Basic Functionality**
- [ ] User can search for vehicles
- [ ] User can create bookings
- [ ] Payment modal appears with correct details
- [ ] Phone number input works
- [ ] STK Push initiates successfully

### **Payment Processing**
- [ ] Payment status updates in real-time
- [ ] Progress bar shows during processing
- [ ] Success message appears on completion
- [ ] Receipt number is displayed
- [ ] Booking status changes to "paid"

### **User Experience**
- [ ] Clear error messages for failures
- [ ] Retry payment option works
- [ ] Cancel booking option works
- [ ] Payment history displays correctly
- [ ] Mobile-responsive design works

### **Data Integrity**
- [ ] All transactions logged in database
- [ ] Payment amounts match booking totals
- [ ] Receipt numbers are unique
- [ ] Booking seats are properly reserved

## 🎉 Success Indicators

### **Payment System is Working When:**
1. ✅ Bookings create successfully with payment deadlines
2. ✅ STK Push initiates without errors
3. ✅ Payment status updates automatically
4. ✅ Mock payments complete in ~10 seconds
5. ✅ Receipt numbers are generated and displayed
6. ✅ Booking status changes from "pending" to "paid"
7. ✅ Payment history shows completed transactions

### **Ready for Production When:**
1. ✅ All mock tests pass consistently
2. ✅ Real M-Pesa credentials obtained
3. ✅ Callback URL is publicly accessible via HTTPS
4. ✅ Small test payments work with real M-Pesa
5. ✅ Error handling covers all edge cases
6. ✅ User experience is smooth and intuitive

---

## 📞 Support

For technical issues during testing:
1. Check server console logs for detailed error messages
2. Verify database contains expected records
3. Test with different phone number formats
4. Try different booking scenarios (future dates, different routes)
5. Clear browser cache if experiencing frontend issues

The mock payment system is designed to be completely reliable for testing - if payments aren't completing automatically, check the server logs for any error messages.