const { createConnection } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function updateDatabaseForPayments() {
    try {
        const connection = await createConnection();
        
        console.log('🔄 Updating database for payment system...\n');
        
        // Check if payment columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'bensdb' 
            AND TABLE_NAME = 'bookings' 
            AND COLUMN_NAME IN ('total_amount', 'payment_status', 'payment_method', 'payment_deadline')
        `);
        
        if (columns.length === 0) {
            console.log('📝 Adding payment columns to bookings table...');
            
            // Add payment columns to bookings table
            await connection.execute(`
                ALTER TABLE bookings 
                ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
                ADD COLUMN payment_method ENUM('mpesa', 'cash') DEFAULT 'mpesa',
                ADD COLUMN payment_deadline DATETIME,
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
            
            console.log('✅ Payment columns added to bookings table');
        } else {
            console.log('✅ Payment columns already exist in bookings table');
        }
        
        // Check if payments table exists
        const [paymentsTables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'bensdb' 
            AND TABLE_NAME = 'payments'
        `);
        
        if (paymentsTables.length === 0) {
            console.log('📝 Creating payments table...');
            
            // Create payments table
            await connection.execute(`
                CREATE TABLE payments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    booking_id INT,
                    mpesa_transaction_id VARCHAR(100),
                    mpesa_receipt_number VARCHAR(100),
                    phone_number VARCHAR(15),
                    amount DECIMAL(10,2),
                    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                    mpesa_response TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (booking_id) REFERENCES bookings(id),
                    INDEX idx_mpesa_transaction (mpesa_transaction_id),
                    INDEX idx_booking_payment (booking_id)
                )
            `);
            
            console.log('✅ Payments table created');
        } else {
            console.log('✅ Payments table already exists');
        }
        
        // Check if mpesa_requests table exists
        const [mpesaRequestsTables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'bensdb' 
            AND TABLE_NAME = 'mpesa_requests'
        `);
        
        if (mpesaRequestsTables.length === 0) {
            console.log('📝 Creating mpesa_requests table...');
            
            // Create mpesa_requests table
            await connection.execute(`
                CREATE TABLE mpesa_requests (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    booking_id INT,
                    checkout_request_id VARCHAR(100),
                    merchant_request_id VARCHAR(100),
                    phone_number VARCHAR(15),
                    amount DECIMAL(10,2),
                    status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
                    response_code VARCHAR(10),
                    response_description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (booking_id) REFERENCES bookings(id),
                    INDEX idx_checkout_request (checkout_request_id)
                )
            `);
            
            console.log('✅ M-Pesa requests table created');
        } else {
            console.log('✅ M-Pesa requests table already exists');
        }
        
        // Check if payment_callbacks table exists
        const [callbacksTables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'bensdb' 
            AND TABLE_NAME = 'payment_callbacks'
        `);
        
        if (callbacksTables.length === 0) {
            console.log('📝 Creating payment_callbacks table...');
            
            // Create payment_callbacks table
            await connection.execute(`
                CREATE TABLE payment_callbacks (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    checkout_request_id VARCHAR(100),
                    merchant_request_id VARCHAR(100),
                    result_code INT,
                    result_desc TEXT,
                    mpesa_receipt_number VARCHAR(100),
                    transaction_date DATETIME,
                    phone_number VARCHAR(15),
                    amount DECIMAL(10,2),
                    raw_callback TEXT,
                    processed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_checkout_callback (checkout_request_id)
                )
            `);
            
            console.log('✅ Payment callbacks table created');
        } else {
            console.log('✅ Payment callbacks table already exists');
        }
        
        // Update existing bookings to have payment information
        console.log('📝 Updating existing bookings with payment information...');
        
        const [existingBookings] = await connection.execute(`
            SELECT b.id, b.seats_booked, v.price 
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            WHERE b.total_amount = 0 OR b.total_amount IS NULL
        `);
        
        for (const booking of existingBookings) {
            const totalAmount = booking.seats_booked * booking.price;
            await connection.execute(`
                UPDATE bookings 
                SET total_amount = ?, payment_status = 'paid'
                WHERE id = ?
            `, [totalAmount, booking.id]);
        }
        
        console.log(`✅ Updated ${existingBookings.length} existing bookings`);
        
        // Summary
        const [bookingsCount] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
        const [paymentsCount] = await connection.execute('SELECT COUNT(*) as count FROM payments');
        
        console.log('\n=== DATABASE UPDATE SUMMARY ===');
        console.log(`✅ Total bookings: ${bookingsCount[0].count}`);
        console.log(`✅ Payment records: ${paymentsCount[0].count}`);
        console.log('✅ Payment system tables created successfully!');
        console.log('\n📱 M-Pesa Integration Features:');
        console.log('   • STK Push payment initiation');
        console.log('   • Real-time payment status tracking');
        console.log('   • Payment deadline enforcement (24h before travel)');
        console.log('   • Automatic booking confirmation on payment');
        console.log('   • Payment history and receipts');
        
        await connection.end();
    } catch (error) {
        console.error('❌ Database update failed:', error);
    }
}

// Run if called directly
if (require.main === module) {
    updateDatabaseForPayments();
}

module.exports = { updateDatabaseForPayments };