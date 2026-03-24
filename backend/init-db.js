require('dotenv').config();
const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    let connection;
    try {
        connection = await createConnection();
        console.log('Connected to database ✅');

        // Disable FK checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Drop all tables
        const tables = ['sms_logs', 'payments', 'bookings', 'trips', 'vehicle_schedules', 'vehicles', 'contacts', 'messages', 'conversations', 'users'];
        for (const table of tables) {
            await connection.execute(`DROP TABLE IF EXISTS ${table}`);
            console.log(`Dropped table: ${table}`);
        }

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        // Create users table
        await connection.execute(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                id_number VARCHAR(20),
                password VARCHAR(255),
                role ENUM('admin', 'owner', 'client') DEFAULT 'client',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created users table ✅');

        // Create vehicles table
        await connection.execute(`
            CREATE TABLE vehicles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                owner_id INT NOT NULL,
                vehicle_number VARCHAR(50) UNIQUE NOT NULL,
                vehicle_type ENUM('bus', 'shuttle') DEFAULT 'bus',
                route_from VARCHAR(100) NOT NULL,
                route_to VARCHAR(100) NOT NULL,
                total_seats INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                registration_fee DECIMAL(10,2) DEFAULT 0,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_owner_id (owner_id)
            )
        `);
        console.log('Created vehicles table ✅');

        // Create vehicle_schedules table
        await connection.execute(`
            CREATE TABLE vehicle_schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                departure_time TIME NOT NULL,
                day_of_week VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                UNIQUE KEY unique_schedule (vehicle_id, departure_time, day_of_week),
                INDEX idx_vehicle_schedule (vehicle_id)
            )
        `);
        console.log('Created vehicle_schedules table ✅');

        // Create trips table
        await connection.execute(`
            CREATE TABLE trips (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                travel_date DATE NOT NULL,
                departure_time TIME NOT NULL,
                available_seats INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                INDEX idx_vehicle_id (vehicle_id),
                INDEX idx_travel_date (travel_date)
            )
        `);
        console.log('Created trips table ✅');

        // Create bookings table
        await connection.execute(`
            CREATE TABLE bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                client_id INT,
                trip_id INT NOT NULL,
                seats_booked INT DEFAULT 1,
                seat_numbers TEXT,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'mpesa',
                payment_deadline DATETIME,
                customer_name VARCHAR(100) NOT NULL,
                customer_email VARCHAR(100),
                customer_phone VARCHAR(20) NOT NULL,
                customer_id_number VARCHAR(20),
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
                INDEX idx_client_id (client_id),
                INDEX idx_trip_id (trip_id)
            )
        `);
        console.log('Created bookings table ✅');

        // Create payments table
        await connection.execute(`
            CREATE TABLE payments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                mpesa_transaction_id VARCHAR(100),
                mpesa_receipt_number VARCHAR(100),
                phone_number VARCHAR(20) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                mpesa_response TEXT,
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                INDEX idx_booking_id (booking_id)
            )
        `);
        console.log('Created payments table ✅');

        // Create contacts table
        await connection.execute(`
            CREATE TABLE contacts (
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
                status ENUM('new', 'read', 'responded') DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created contacts table ✅');

        // Create sms_logs table
        await connection.execute(`
            CREATE TABLE sms_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                phone_number VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                message_id VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                cost DECIMAL(10,4),
                network VARCHAR(50),
                delivery_status VARCHAR(50),
                failure_reason TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                delivered_at TIMESTAMP NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_phone (phone_number),
                INDEX idx_message_id (message_id),
                INDEX idx_status (status)
            )
        `);
        console.log('Created sms_logs table ✅');

        // Create messages table
        await connection.execute(`
            CREATE TABLE messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT,
                receiver_id INT,
                subject VARCHAR(255) DEFAULT 'No Subject',
                message TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('Created messages table ✅');

        // Create conversations table
        await connection.execute(`
            CREATE TABLE conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                owner_id INT,
                admin_id INT,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_conversation (owner_id, admin_id),
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Created conversations table ✅');

        // Insert admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
            `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Admin', 'admin@benstrans.com', '0700000000', adminPassword, 'admin', 'approved']
        );
        console.log('Admin user created: admin@benstrans.com / admin123 ✅');

        // Insert test owner
        const ownerPassword = await bcrypt.hash('owner123', 10);
        await connection.execute(
            `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Mwasya', 'mwasya@gmail.com', '0712345678', ownerPassword, 'owner', 'approved']
        );
        console.log('Owner user created: mwasya@gmail.com / owner123 ✅');

        // Insert test pending clients
        const clientPassword = await bcrypt.hash('client123', 10);
        const testClients = [
            ['John Doe', 'john@test.com', '0711000001'],
            ['Jane Smith', 'jane@test.com', '0711000002'],
            ['Mike Johnson', 'mike@test.com', '0711000003']
        ];
        for (const [name, email, phone] of testClients) {
            await connection.execute(
                `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
                [name, email, phone, clientPassword, 'client', 'pending']
            );
        }
        console.log('Test pending clients created (password: client123) ✅');

        // Insert test contact messages
        await connection.execute(
            `INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
            ['Alice Brown', 'alice@test.com', '0722000001', 'Booking Inquiry', 'I need help booking a trip to Mombasa.']
        );
        await connection.execute(
            `INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
            ['Bob Wilson', 'bob@test.com', '0722000002', 'Payment Issue', 'I had trouble with payment processing.']
        );
        console.log('Test contact messages created ✅');

        console.log('\n========== DATABASE SETUP COMPLETE ==========');
        console.log('Admin login:  admin@benstrans.com / admin123');
        console.log('Owner login:  mwasya@gmail.com / owner123');
        console.log('Client login: john@test.com / client123');
        console.log('=============================================\n');

        await connection.end();
    } catch (error) {
        console.error('Database init error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

initDatabase();