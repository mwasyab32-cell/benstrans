-- Bens Trans Complete Database Schema
USE defaultdb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS sms_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    id_number VARCHAR(20),
    password VARCHAR(255),
    role ENUM('admin', 'owner', 'client') DEFAULT 'client',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT,
    vehicle_number VARCHAR(50) UNIQUE,
    vehicle_type ENUM('bus', 'shuttle') DEFAULT 'bus',
    route_from VARCHAR(100),
    route_to VARCHAR(100),
    total_seats INT,
    price DECIMAL(10,2),
    registration_fee DECIMAL(10,2) DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT,
    travel_date DATE,
    departure_time TIME,
    available_seats INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT,
    trip_id INT,
    seats_booked INT DEFAULT 1,
    seat_numbers TEXT,
    total_amount DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'mpesa',
    payment_deadline DATETIME,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_id_number VARCHAR(20),
    reference_number VARCHAR(50) UNIQUE,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT,
    amount DECIMAL(10,2),
    mpesa_receipt_number VARCHAR(50),
    phone_number VARCHAR(20),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
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

-- SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20),
    message TEXT,
    message_id VARCHAR(100),
    status VARCHAR(50),
    cost VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);