# Bens Trans - Vehicle Booking System

A complete vehicle booking system for PSV (Public Service Vehicle) management with admin approval workflows.

## Features

✅ **Multi-Role System**: Admin, Vehicle Owner, Client (Passenger)  
✅ **Admin Approval Workflow**: Approve owners and vehicles  
✅ **Real-time Seat Tracking**: Prevent overbooking  
✅ **Route-based Search**: Find vehicles by route and date  
✅ **Secure Authentication**: JWT-based auth with role-based access  
✅ **Responsive Design**: Works on desktop and mobile  

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt password hashing

## Installation & Setup

### 1. Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Git

### 2. Clone Repository
```bash
git clone <repository-url>
cd vehicle-booking-system
```

### 3. Database Setup
1. Create MySQL database:
```sql
CREATE DATABASE bensdb;
```

2. Import schema:
```bash
mysql -u root -p bensdb < database/schema.sql
```

### 4. Backend Setup
```bash
cd backend
npm install
npm start
```

Server runs on: `http://localhost:3000`

### 5. Frontend Access
Open browser and navigate to: `http://localhost:3000`

## Default Admin Account
- **Email**: admin@benstrans.com
- **Password**: admin123 (change after first login)

## User Roles & Workflows

### 🔧 Admin
1. Login with admin credentials
2. Approve pending vehicle owners
3. Approve registered vehicles
4. Monitor system activity

### 🚗 Vehicle Owner
1. Register as owner (pending approval)
2. Wait for admin approval
3. Register vehicles with routes and pricing
4. Wait for vehicle approval
5. Manage vehicle listings

### 👤 Client (Passenger)
1. Register as client
2. Search vehicles by route and date
3. View available seats in real-time
4. Book seats (prevents overbooking)
5. View booking history

## API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login    - User login
```

### Admin (Admin only)
```
GET  /api/admin/pending-owners     - Get pending owners
PUT  /api/admin/approve-user/:id   - Approve user
GET  /api/admin/pending-vehicles   - Get pending vehicles  
PUT  /api/admin/approve-vehicle/:id - Approve vehicle
```

### Vehicles (Owner only)
```
POST /api/vehicles/register    - Register vehicle
GET  /api/vehicles/my-vehicles - Get owner's vehicles
```

### Trips & Bookings
```
GET  /api/vehicles/trips/search - Search available trips
POST /api/bookings             - Create booking (Client only)
GET  /api/bookings/my-bookings - Get user bookings (Client only)
```

## Database Schema

### Users Table
- Stores admin, owners, and clients
- Approval status tracking

### Vehicles Table  
- Vehicle details and routes
- Owner relationship
- Admin approval status

### Trips Table
- Available trips with dates/times
- Seat availability tracking

### Bookings Table
- Client bookings
- Seat count tracking
- Prevents overbooking

## Security Features

🔒 **Password Hashing**: bcrypt encryption  
🔒 **JWT Authentication**: Secure token-based auth  
🔒 **Role-based Access**: Route protection by user role  
🔒 **Input Validation**: Prevent malicious inputs  
🔒 **Overbooking Prevention**: Real-time seat validation  

## File Structure
```
vehicle-booking-system/
├── frontend/           # HTML, CSS, JS files
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   ├── admin/         # Admin pages
│   ├── owner/         # Owner pages
│   └── client/        # Client pages
├── backend/           # Node.js backend
│   ├── config/        # Database config
│   ├── routes/        # API routes
│   ├── controllers/   # Business logic
│   ├── middleware/    # Auth & validation
│   └── server.js      # Main server file
└── database/          # SQL schema
```

## Development

### Start Development Server
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Database Connection
Update `backend/config/db.js` with your MySQL credentials:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'bensdb'
};
```

## Future Enhancements

🚀 **M-Pesa Integration**: Mobile money payments  
🚀 **SMS Notifications**: Booking confirmations  
🚀 **Seat Selection UI**: Visual seat picker  
🚀 **Admin Dashboard**: Analytics and reports  
🚀 **Mobile App**: React Native/Flutter app  

## Support

For issues and questions:
- Create GitHub issue
- Email: support@benstrans.com

## License

MIT License - see LICENSE file for details.

---

**Bens Trans** - Making PSV booking simple and efficient! 🚌