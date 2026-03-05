-- Payment System Extension for Bens Trans
USE bensdb;

-- Add payment status to bookings table
ALTER TABLE bookings 
ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN payment_method ENUM('mpesa', 'cash') DEFAULT 'mpesa',
ADD COLUMN payment_deadline DATETIME,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Payments Table for M-Pesa transactions
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
);

-- M-Pesa STK Push requests tracking
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
);

-- Payment notifications/callbacks from M-Pesa
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
);