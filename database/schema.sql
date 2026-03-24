-- Bens Trans Complete Database Schema
USE defaultdb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS payment_callbacks;
DROP TABLE IF EXISTS mpesa_requests;
DROP TABLE IF EXISTS sms_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_number VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'owner', 'client') DEFAULT 'client',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
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
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    travel_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    available_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_travel_date (travel_date)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
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
    INDEX idx_trip_id (trip_id),
    INDEX idx_payment_status (payment_status)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
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
    INDEX idx_booking_id (booking_id),
    INDEX idx_mpesa_transaction (mpesa_transaction_id)
);

-- M-Pesa STK Push Requests Table
CREATE TABLE IF NOT EXISTS mpesa_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT,
    checkout_request_id VARCHAR(100),
    merchant_request_id VARCHAR(100),
    phone_number VARCHAR(20),
    amount DECIMAL(10,2),
    status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
    response_code VARCHAR(10),
    response_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_checkout_request (checkout_request_id)
);

-- Payment Callbacks Table
CREATE TABLE IF NOT EXISTS payment_callbacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    checkout_request_id VARCHAR(100),
    merchant_request_id VARCHAR(100),
    result_code INT,
    result_desc TEXT,
    mpesa_receipt_number VARCHAR(100),
    transaction_date DATETIME,
    phone_number VARCHAR(20),
    amount DECIMAL(10,2),
    raw_callback TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_checkout_callback (checkout_request_id)
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
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
);

-- Messages Table
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
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_created (created_at)
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    admin_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_admin (admin_id),
    UNIQUE KEY unique_conversation (owner_id, admin_id)
);

-- Message Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message (message_id)
);

-- SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
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
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);
