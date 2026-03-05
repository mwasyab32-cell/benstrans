# Vehicle Registration Troubleshooting Guide

## Common Issues and Solutions

### 1. "Owner account must be approved" Error
**Problem**: Owners can't register vehicles because their account is pending approval.

**Solutions**:
- Run the approval script: `node backend/approve-owners.js`
- Or manually approve via admin dashboard
- Check user status in database: `SELECT * FROM users WHERE role='owner';`

### 2. "Connection error: Please ensure the server is running"
**Problem**: Frontend can't connect to backend server.

**Solutions**:
- Start the backend server: `cd backend && node server.js`
- Verify server is running on http://localhost:3000
- Check for port conflicts
- Ensure MySQL is running

### 3. "Database connection failed"
**Problem**: Backend can't connect to MySQL database.

**Solutions**:
- Start MySQL service
- Verify database credentials in `backend/config/db.js`
- Create database: `CREATE DATABASE bensdb;`
- Run schema: `mysql -u root -p bensdb < database/schema.sql`

### 4. "Invalid or expired token" Error
**Problem**: Authentication token issues.

**Solutions**:
- Clear browser localStorage and login again
- Check token in browser dev tools (Application > Local Storage)
- Verify JWT_SECRET in backend

### 5. "All fields are required" Error
**Problem**: Form validation failing.

**Solutions**:
- Ensure all form fields are filled
- Check for JavaScript errors in browser console
- Verify form field IDs match JavaScript selectors

## Diagnostic Steps

### Step 1: Run Diagnostics
```bash
cd backend
node diagnose-issues.js
```

### Step 2: Check Server Status
```bash
cd backend
node server.js
```
Should show: "Bens Trans server running on port 3000"

### Step 3: Test Database Connection
```bash
mysql -u root -p
USE bensdb;
SHOW TABLES;
SELECT * FROM users WHERE role='owner';
```

### Step 4: Check Browser Console
1. Open browser dev tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### Step 5: Verify User Status
```sql
-- Check owner approval status
SELECT id, name, email, role, status FROM users WHERE role='owner';

-- Approve all pending owners
UPDATE users SET status='approved' WHERE role='owner' AND status='pending';
```

## Quick Fixes

### Fix 1: Approve All Pending Owners
```bash
cd backend
node approve-owners.js
```

### Fix 2: Reset User Session
1. Open browser dev tools
2. Go to Application > Local Storage
3. Delete 'token' and 'user' entries
4. Login again

### Fix 3: Restart Services
```bash
# Restart MySQL (Windows)
net stop mysql80
net start mysql80

# Restart backend server
cd backend
node server.js
```

## Testing Vehicle Registration

1. **Login as approved owner**
2. **Fill all form fields**:
   - Vehicle Type: bus or shuttle
   - Vehicle Number: unique identifier
   - Route From/To: valid locations
   - Total Seats: positive number
   - Price: positive decimal

3. **Submit form and check**:
   - Success message appears
   - Vehicle appears in "My Vehicles" table
   - Status shows as "pending"

## Contact Information
If issues persist, check:
- Server logs in terminal
- Browser console errors
- Database connection status
- Network connectivity