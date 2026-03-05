# Messaging System - Quick Start Guide

## 🚀 Setup (One-Time)

```bash
# 1. Navigate to backend folder
cd vehicle-booking-system/backend

# 2. Create messaging tables
node setup-messaging.js

# 3. Test the system (optional)
node test-messaging.js

# 4. Start the server
node server.js
```

## 💬 How to Use

### For Vehicle Owners

1. **Login** as owner (e.g., mwasya@gmail.com)
2. **Navigate** to vehicle registration page
3. **Look** for purple chatbox in bottom-right corner (💬 Messages)
4. **Click** "➕ New Message to Admin" button
5. **Select** an admin from dropdown
6. **Type** your message and click "Send"

### For Admins

1. **Login** as admin (e.g., admin@benstrans.com)
2. **Navigate** to admin dashboard
3. **Look** for purple chatbox in bottom-right corner (💬 Messages)
4. **Click** any conversation to view messages
5. **Reply** to owner messages

## 🎨 Features

- ✅ Real-time messaging between owners and admins
- ✅ Unread message count badge
- ✅ Conversation history
- ✅ Auto-refresh every 10 seconds
- ✅ Minimizable chatbox
- ✅ Mobile responsive
- ✅ Message timestamps

## 📍 Chatbox Location

The chatbox appears as a **floating purple box** in the **bottom-right corner** of:
- Owner dashboard (`/owner/registerVehicle.html`)
- Admin dashboard (`/admin/dashboard.html`)

## 🔧 Troubleshooting

**Chatbox not showing?**
- Make sure you're logged in as owner or admin
- Check that server is running on port 3000
- Clear browser cache and reload

**Messages not sending?**
- Verify internet connection
- Check browser console for errors
- Ensure recipient is selected (for new messages)

**Database errors?**
- Run `node setup-messaging.js` again
- Check MySQL is running
- Verify database credentials in `.env`

## 📊 Test Accounts

Use these accounts to test messaging:

**Owner Account:**
- Email: mwasya@gmail.com
- Password: (your owner password)

**Admin Account:**
- Email: admin@benstrans.com
- Password: admin123

## 🎯 What's Next?

The messaging system is **fully functional** and ready to use! Owners can now:
- Ask questions about vehicle registration
- Report issues with their vehicles
- Request approval status updates
- Communicate directly with admins

Admins can:
- Respond to owner inquiries
- Provide support and guidance
- Manage multiple conversations
- Track unread messages

---

**Status:** ✅ COMPLETE AND READY TO USE
