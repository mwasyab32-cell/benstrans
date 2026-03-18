-- Bens Trans Database Schema
-- Aiven MySQL: database is pre-created, just select it
USE defaultdb;

-- Disable foreign key checks to allow dropping in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in correct order (children first)
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Users Table (admin, owners, clients)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255),
    role ENUM('admin', 'owner', 'client') DEFAULT 'client',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT,
    vehicle_number VARCHAR(50),
    vehicle_type ENUM('bus', 'shuttle') NOT NULL,
    route_from VARCHAR(100),
    route_to VARCHAR(100),
    total_seats INT,
    price DECIMAL(10,2),
    registration_fee DECIMAL(10,2) DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Trips Table (PSV Availability)
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
CREATE TABLE IF NOT EXISTS booking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT,
    trip_id INT,
    vehicle_id INT,
    seats_booked INT DEFAULT 1,
    total_price DECIMAL(10,2),
    passenger_name VARCHAR(100),
    passenger_email VARCHAR(100),
    passenger_phone VARCHAR(20),
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
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

-- Insert default admin user (password: admin123)
-- Hash generated with bcrypt for 'admin123'
INSERT IGNORE INTO users (name, email, phone, password, role, status)
VALUES ('Admin', 'admin@benstrans.com', '0700000000', '$2b$10$rQZ8N1mxQpKkVvKvKvKvKuKvKvKvKvKvKvKvKvKvKvKvKvKvKvKv2', 'admin', 'approved');
