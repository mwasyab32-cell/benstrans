# Auto Account Creation & Validation System

## ✅ Features Implemented

### 1. Input Validation
- **Phone Number**: Exactly 10 digits, numbers only
- **ID Number**: Exactly 8 digits, numbers only
- Real-time validation as user types
- HTML5 pattern validation
- JavaScript validation before submission

### 2. Auto Account Creation
When a guest makes a booking:
- System checks if email already exists
- If new user: Creates approved client account automatically
- Default password: `password123`
- Account status: `approved` (no admin approval needed)
- User can login immediately after booking

### 3. Admin Bookings View
- View all bookings in one place
- Filter by status (paid/pending/cancelled)
- Search by name, email, or reference
- Filter by date range
- See statistics (total bookings, revenue, etc.)

## 📋 Validation Rules

### Phone Number
- **Format**: 10 digits
- **Example**: 0712345678
- **Validation**: Only numbers, no spaces or special characters
- **Min/Max**: Exactly 10 digits

### ID Number
- **Format**: 8 digits
- **Example**: 12345678
- **Validation**: Only numbers
- **Min/Max**: Exactly 8 digits

## 🚀 How It Works

### Guest Booking Flow:
1. User searches for trips (no login required)
2. Selects vehicle and seats
3. Enters personal details:
   - Full name
   - Email
   - Phone (10 digits)
   - ID number (8 digits)
4. System validates inputs
5. If email is new:
   - Creates client account automatically
   - Sets status to "approved"
   - Sets default password: `password123`
6. Creates booking linked to user account
7. User receives confirmation

### Account Benefits:
- User can login with email and default password
- Can view booking history
- Can make future bookings faster
- No need to re-enter details

## 🔐 Security

- Passwords are hashed with bcrypt
- Default password should be changed by user
- Email must be unique
- Phone and ID validation prevents invalid data
- All bookings linked to user accounts for tracking

## 📍 Admin Access

**View All Bookings:**
1. Login as admin
2. Go to admin dashboard
3. Click "📋 View All Bookings" button
4. Or navigate to `admin/bookings.html`

**Features:**
- See all bookings across all trips
- Filter and search
- View statistics
- Export-ready table format

## 🎯 API Endpoints

### Guest Booking (Auto Account Creation)
```
POST /api/bookings/guest
Body: {
  trip_id, seats_booked, seat_numbers,
  customer_name, customer_email, 
  customer_phone, customer_id_number
}
```

### Admin View Bookings
```
GET /api/admin/bookings
Headers: Authorization: Bearer <admin_token>
```

## ✨ User Experience

### Before:
- Guest books → No account created
- Must re-enter details for each booking
- Cannot track bookings
- Admin approval required for clients

### After:
- Guest books → Account auto-created
- Can login immediately
- View booking history
- Make future bookings faster
- No admin approval needed
- Validated phone and ID numbers

## 📝 Default Credentials

When account is auto-created:
- **Email**: User's provided email
- **Password**: `password123`
- **Status**: Approved (ready to use)
- **Role**: Client

**User should change password after first login!**

## 🔧 Files Modified

### Backend:
- `controllers/booking.controller.js` - Auto account creation
- `controllers/admin.controller.new.js` - Get all bookings
- `routes/admin.routes.js` - Bookings endpoint

### Frontend:
- `book-now.html` - Input validation
- `admin/bookings.html` - Admin bookings view
- `admin/dashboard.html` - Link to bookings

---

**Status**: ✅ Fully Implemented and Working

Restart your backend server to apply changes!
