# Vehicle Management Guide for Owners

## ✅ Features Available

Owners can now fully manage their vehicles with the following features:

### 1. View All Vehicles
- See all registered vehicles in a grid layout
- View status (Approved/Pending/Rejected)
- See registration date, route, seats, and price

### 2. Edit Vehicle Details
- Update vehicle number/plate
- Change route (from/to)
- Modify total seats
- Update price per seat
- Change vehicle type

### 3. Delete Vehicles
- Remove vehicles from the system
- Safety check: Cannot delete vehicles with active bookings
- Confirmation required before deletion

## 🚀 How to Access

### Step 1: Login as Owner
1. Go to `login.html`
2. Login with your owner credentials
3. You'll be redirected to the owner dashboard

### Step 2: Access Vehicle Management
**Option A:** From Register Vehicle Page
- Go to `owner/registerVehicle.html`
- Click the green "Manage My Vehicles" button in the top navigation

**Option B:** Direct Access
- Navigate directly to `owner/manageVehicles.html`

## 📝 How to Edit a Vehicle

1. Go to `owner/manageVehicles.html`
2. Find the vehicle you want to edit
3. Click the "Edit" button on the vehicle card
4. A modal will open with the current vehicle details
5. Make your changes
6. Click "Save Changes"
7. The vehicle will be updated immediately

## 🗑️ How to Delete a Vehicle

1. Go to `owner/manageVehicles.html`
2. Find the vehicle you want to delete
3. Click the "Delete" button
4. Confirm the deletion in the popup
5. The vehicle will be removed (if no active bookings exist)

## ⚠️ Important Notes

### Cannot Delete If:
- Vehicle has active bookings (future trips with confirmed passengers)
- You'll see an error message explaining why

### After Editing:
- Changes are immediate
- If vehicle was approved, it remains approved
- If vehicle was pending, it stays pending (admin must re-approve if needed)

### Security:
- You can only edit/delete YOUR OWN vehicles
- Other owners cannot access your vehicles
- All actions require authentication

## 🔧 Troubleshooting

### "Failed to load vehicles"
1. Make sure backend server is running: `node server.js`
2. Check you're logged in as an owner
3. Clear browser cache (Ctrl + Shift + R)

### "Vehicle not found" when editing
1. Restart your backend server
2. The route order was fixed - restart is required
3. Refresh the page

### Edit button doesn't work
1. Check browser console for errors (F12)
2. Verify you're logged in (check localStorage for 'token')
3. Make sure backend server is running

## 📍 File Locations

- **Frontend Page**: `vehicle-booking-system/frontend/owner/manageVehicles.html`
- **Backend Controller**: `vehicle-booking-system/backend/controllers/vehicle.controller.js`
- **Backend Routes**: `vehicle-booking-system/backend/routes/vehicle.routes.js`

## 🎯 API Endpoints

- `GET /api/vehicles/my-vehicles` - List all your vehicles
- `GET /api/vehicles/:id` - Get single vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

## ✨ Next Steps

After managing your vehicles:
1. Create trip schedules for your vehicles
2. Monitor bookings on your trips
3. Track earnings from your vehicles

---

**Need Help?** Contact admin or check the browser console for detailed error messages.
