-- SMS Delivery Reports Schema
USE bensdb;

-- SMS Logs Table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_message_id (message_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);
