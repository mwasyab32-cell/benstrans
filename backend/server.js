require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const contactRoutes = require('./routes/contact.routes');
const messageRoutes = require('./routes/message.routes');
const paymentRoutes = require('./routes/payment.routes');
const smsRoutes = require('./routes/sms.routes');
const { createConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // handle form submissions
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sms', smsRoutes);

// Fallback route to serve frontend (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Auto-initialize database tables on startup
async function initDatabase() {
    let connection;
    try {
        connection = await createConnection();
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                id_number VARCHAR(20) DEFAULT '',
                password VARCHAR(255) NOT NULL,
                role ENUM('admin','owner','client') DEFAULT 'client',
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS vehicles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                owner_id INT NOT NULL,
                vehicle_number VARCHAR(50) UNIQUE NOT NULL,
                vehicle_type ENUM('bus','shuttle') DEFAULT 'bus',
                route_from VARCHAR(100) NOT NULL,
                route_to VARCHAR(100) NOT NULL,
                total_seats INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                registration_fee DECIMAL(10,2) DEFAULT 0,
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS vehicle_schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                departure_time TIME NOT NULL,
                day_of_week VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                UNIQUE KEY unique_schedule (vehicle_id, departure_time, day_of_week)
            )`,
            `CREATE TABLE IF NOT EXISTS trips (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                travel_date DATE NOT NULL,
                departure_time TIME NOT NULL,
                available_seats INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                client_id INT,
                trip_id INT NOT NULL,
                seats_booked INT DEFAULT 1,
                seat_numbers TEXT,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_status ENUM('pending','paid','failed','cancelled') DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'mpesa',
                payment_deadline DATETIME,
                customer_name VARCHAR(100) NOT NULL,
                customer_email VARCHAR(100),
                customer_phone VARCHAR(20) NOT NULL,
                customer_id_number VARCHAR(20),
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS contacts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                subject VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                admin_reply TEXT,
                replied_at TIMESTAMP NULL,
                client_reply TEXT,
                client_replied_at TIMESTAMP NULL,
                status ENUM('new','read','responded') DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                subject VARCHAR(255) DEFAULT 'No Subject',
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                owner_id INT NOT NULL,
                admin_id INT NOT NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_conversation (owner_id, admin_id)
            )`
        ];
        for (const sql of tables) {
            await connection.execute(sql);
        }
        console.log('✅ Database tables initialized');

        // Auto-create admin if none exists
        const [admins] = await connection.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                "INSERT INTO users (name, email, phone, id_number, password, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'approved')",
                ['Admin', 'admin@benstrans.com', '0700000000', '00000000', hashedPassword]
            );
            console.log('✅ Default admin created — email: admin@benstrans.com | password: admin123');
        }
    } catch (err) {
        console.error('⚠️ DB init error:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`Bens Trans server running on port ${PORT}`);
    await initDatabase();
});