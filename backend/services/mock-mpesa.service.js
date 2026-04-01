const { createConnection } = require('../config/db');

class MockMpesaService {
    constructor() {
        console.log('🧪 Using Mock M-Pesa Service for Development/Testing');
        this.businessShortCode = '174379';
        this.callbackUrl = 'http://localhost:3000/api/payments/mpesa-callback';
    }

    // Mock OAuth token generation
    async getAccessToken() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return 'mock_access_token_' + Date.now();
    }

    // Generate timestamp for M-Pesa
    generateTimestamp() {
        const now = new Date();
        return now.getFullYear() +
               String(now.getMonth() + 1).padStart(2, '0') +
               String(now.getDate()).padStart(2, '0') +
               String(now.getHours()).padStart(2, '0') +
               String(now.getMinutes()).padStart(2, '0') +
               String(now.getSeconds()).padStart(2, '0');
    }

    // Generate password for M-Pesa STK Push
    generatePassword(timestamp) {
        const data = this.businessShortCode + 'mock_passkey' + timestamp;
        return Buffer.from(data).toString('base64');
    }

    // Mock STK Push payment initiation
    async initiateSTKPush(phoneNumber, amount, bookingId, accountReference = 'Bens Trans Booking') {
        try {
            console.log(`🔄 Mock STK Push initiated for ${phoneNumber}, Amount: KSh ${amount}, Booking: ${bookingId}`);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Format phone number
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            // Generate mock response
            const mockCheckoutRequestId = 'ws_CO_' + Date.now() + Math.random().toString(36).substr(2, 9);
            const mockMerchantRequestId = 'mock_merchant_' + Date.now();
            
            const mockResponse = {
                CheckoutRequestID: mockCheckoutRequestId,
                MerchantRequestID: mockMerchantRequestId,
                ResponseCode: '0',
                ResponseDescription: 'Success. Request accepted for processing',
                CustomerMessage: 'Success. Request accepted for processing'
            };

            // Save STK push request to database
            await this.saveSTKPushRequest(bookingId, mockResponse, formattedPhone, amount);

            // Simulate successful payment after 10 seconds
            setTimeout(() => {
                this.simulatePaymentCallback(mockCheckoutRequestId, mockMerchantRequestId, formattedPhone, amount);
            }, 10000);

            return {
                success: true,
                checkoutRequestId: mockResponse.CheckoutRequestID,
                merchantRequestId: mockResponse.MerchantRequestID,
                responseCode: mockResponse.ResponseCode,
                responseDescription: mockResponse.ResponseDescription,
                customerMessage: 'Mock payment request sent. Payment will be automatically completed in 10 seconds for testing.'
            };

        } catch (error) {
            console.error('Mock STK Push error:', error);
            return {
                success: false,
                error: 'Mock payment initiation failed: ' + error.message
            };
        }
    }

    // Format phone number for M-Pesa (254XXXXXXXXX)
    formatPhoneNumber(phoneNumber) {
        // Remove any spaces, dashes, or plus signs
        let cleaned = phoneNumber.replace(/[\s\-\+]/g, '');
        
        // If starts with 0, replace with 254
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        }
        
        // If doesn't start with 254, add it
        if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }
        
        return cleaned;
    }

    // Save STK Push request to database
    async saveSTKPushRequest(bookingId, mpesaResponse, phoneNumber, amount) {
        try {
            const connection = await createConnection();
            
            await connection.execute(`
                INSERT INTO mpesa_requests 
                (booking_id, checkout_request_id, merchant_request_id, phone_number, amount, response_code, response_description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                bookingId,
                mpesaResponse.CheckoutRequestID,
                mpesaResponse.MerchantRequestID,
                phoneNumber,
                amount,
                mpesaResponse.ResponseCode,
                mpesaResponse.ResponseDescription
            ]);
            
            await connection.end();
            console.log(`✅ Mock STK push request saved for booking ${bookingId}`);
        } catch (error) {
            console.error('Error saving mock STK push request:', error);
        }
    }

    // Simulate payment callback (auto-complete payment for testing)
    async simulatePaymentCallback(checkoutRequestId, merchantRequestId, phoneNumber, amount) {
        try {
            console.log(`🎯 Simulating successful payment callback for ${checkoutRequestId}`);
            
            const mockCallbackData = {
                CheckoutRequestID: checkoutRequestId,
                MerchantRequestID: merchantRequestId,
                ResultCode: 0,
                ResultDesc: 'The service request is processed successfully.',
                MpesaReceiptNumber: 'MOCK' + Date.now(),
                TransactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
                PhoneNumber: phoneNumber,
                Amount: amount
            };

            // Process the callback
            await this.processCallback(mockCallbackData);
            
            console.log(`✅ Mock payment completed successfully: ${mockCallbackData.MpesaReceiptNumber}`);
        } catch (error) {
            console.error('Error simulating payment callback:', error);
        }
    }

    // Check STK Push status (mock)
    async checkSTKPushStatus(checkoutRequestId) {
        console.log(`🔍 Mock STK Push status check for ${checkoutRequestId}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            ResponseCode: '0',
            ResponseDescription: 'The service request has been accepted successfully',
            MerchantRequestID: 'mock_merchant_' + Date.now(),
            CheckoutRequestID: checkoutRequestId,
            ResultCode: '0',
            ResultDesc: 'The service request is processed successfully.'
        };
    }

    // Process M-Pesa callback (same as real service)
    async processCallback(callbackData) {
        let connection;
        try {
            connection = await createConnection();

            // Ensure payment_callbacks table exists
            await connection.execute(`
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Ensure payments table exists
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    booking_id INT NOT NULL,
                    mpesa_transaction_id VARCHAR(100),
                    mpesa_receipt_number VARCHAR(100),
                    phone_number VARCHAR(20) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
                    mpesa_response TEXT,
                    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            // Save callback data
            await connection.execute(`
                INSERT INTO payment_callbacks 
                (checkout_request_id, merchant_request_id, result_code, result_desc, 
                 mpesa_receipt_number, transaction_date, phone_number, amount, raw_callback)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                callbackData.CheckoutRequestID,
                callbackData.MerchantRequestID,
                callbackData.ResultCode,
                callbackData.ResultDesc,
                callbackData.MpesaReceiptNumber || null,
                callbackData.TransactionDate || null,
                callbackData.PhoneNumber || null,
                callbackData.Amount || null,
                JSON.stringify(callbackData)
            ]);

            // If payment was successful (ResultCode = 0)
            if (callbackData.ResultCode === 0) {
                const [mpesaRequest] = await connection.execute(
                    'SELECT booking_id FROM mpesa_requests WHERE checkout_request_id = ?',
                    [callbackData.CheckoutRequestID]
                );

                if (mpesaRequest.length > 0) {
                    const bookingId = mpesaRequest[0].booking_id;

                    const [bookings] = await connection.execute(`
                        SELECT b.reference_number, b.customer_phone, b.total_amount,
                               v.route_from, v.route_to, t.travel_date, t.departure_time
                        FROM bookings b
                        JOIN trips t ON b.trip_id = t.id
                        JOIN vehicles v ON t.vehicle_id = v.id
                        WHERE b.id = ?
                    `, [bookingId]);

                    await connection.execute(
                        'UPDATE bookings SET payment_status = "paid" WHERE id = ?',
                        [bookingId]
                    );

                    await connection.execute(`
                        INSERT INTO payments 
                        (booking_id, mpesa_transaction_id, mpesa_receipt_number, phone_number, amount, status, mpesa_response)
                        VALUES (?, ?, ?, ?, ?, "completed", ?)
                    `, [
                        bookingId,
                        callbackData.CheckoutRequestID,
                        callbackData.MpesaReceiptNumber,
                        callbackData.PhoneNumber,
                        callbackData.Amount,
                        JSON.stringify(callbackData)
                    ]);

                    console.log(`✅ Mock payment completed for booking #${bookingId} - Receipt: ${callbackData.MpesaReceiptNumber}`);

                    if (bookings.length > 0) {
                        try {
                            const { sendPaymentConfirmation } = require('./sms.service');
                            const booking = bookings[0];
                            sendPaymentConfirmation(booking.customer_phone, {
                                mpesa_receipt: callbackData.MpesaReceiptNumber,
                                amount: callbackData.Amount,
                                reference_number: booking.reference_number
                            }).catch(err => console.error('SMS error:', err));
                        } catch (e) { console.error('SMS service error:', e.message); }
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error processing mock M-Pesa callback:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }
}

module.exports = new MockMpesaService();