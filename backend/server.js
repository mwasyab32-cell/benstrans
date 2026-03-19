const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const contactRoutes = require('./routes/contact.routes');
const paymentRoutes = require('./routes/payment.routes');
const messageRoutes = require('./routes/message.routes');
const smsRoutes = require('./routes/sms.routes');
const { createConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-create missing tables and admin user on startup
async function ensureAdminExists() {
    try {
        const connection = await createConnection();

        // Create messages table if missing
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create conversations table if missing
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                owner_id INT NOT NULL,
                admin_id INT NOT NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_conversation (owner_id, admin_id)
            )
        `);

        // Create sms_logs table if missing
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                phone_number VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                message_id VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                cost VARCHAR(20),
                network VARCHAR(50),
                delivery_status VARCHAR(50),
                failure_reason TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                delivered_at TIMESTAMP NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ All tables verified');

        // Ensure admin exists
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ? AND role = ?',
            ['admin@benstrans.com', 'admin']
        );
        if (existing.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin', 'admin@benstrans.com', '0700000000', hashedPassword, 'admin', 'approved']
            );
            console.log('✅ Admin user created: admin@benstrans.com / admin123');
        } else {
            console.log('✅ Admin user already exists');
        }
        await connection.end();
    } catch (err) {
        console.error('⚠️  Startup setup error:', err.message);
    }
}

// Enhanced CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost:5500',
        'https://benstrans.onrender.com',
        'https://*.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sms', smsRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, async () => {
    console.log(`Bens Trans server running on port ${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
    await ensureAdminExists();
});