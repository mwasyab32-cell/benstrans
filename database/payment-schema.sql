-- Payment System Schema for Bens Trans
USE defaultdb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS payment_callbacks;
DROP TABLE IF EXISTS mpesa_requests;
DROP TABLE IF EXISTS payments;

SET FOREIGN_KEY_CHECKS = 1;

-- Payments Table for M-Pesa transactions
CREATE TABLE IF NOT EXISTS payments (
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
    FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE SET NULL,
    INDEX idx_mpesa_transaction (mpesa_transaction_id),
    INDEX idx_booking_payment (booking_id)
);

-- M-Pesa STK Push requests tracking
CREATE TABLE IF NOT EXISTS mpesa_requests (
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
    FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE SET NULL,
    INDEX idx_checkout_request (checkout_request_id)
);

-- Payment callbacks from M-Pesa
CREATE TABLE IF NOT EXISTS payment_callbacks (
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
