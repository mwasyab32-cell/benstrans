const axios = require('axios');
const { createConnection } = require('../config/db');

class MpesaService {
    constructor() {
        // M-Pesa Sandbox credentials (replace with production for live)
        this.consumerKey = process.env.MPESA_CONSUMER_KEY || 'your_consumer_key';
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret';
        this.businessShortCode = process.env.MPESA_SHORTCODE || '174379';
        this.passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
        this.baseUrl = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
        this.callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/payments/mpesa-callback';
    }

    // Get OAuth token from M-Pesa
    async getAccessToken() {
        try {
            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
            
            const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });
            
            return response.data.access_token;
        } catch (error) {
            console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
            throw new Error('Failed to get M-Pesa access token');
        }
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
        const data = this.businessShortCode + this.passkey + timestamp;
        return Buffer.from(data).toString('base64');
    }

    // Initiate STK Push payment
    async initiateSTKPush(phoneNumber, amount, bookingId, accountReference = 'Bens Trans Booking') {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = this.generateTimestamp();
            const password = this.generatePassword(timestamp);
            
            // Format phone number (remove + and ensure it starts with 254)
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const stkPushData = {
                BusinessShortCode: this.businessShortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(amount), // M-Pesa requires integer amount
                PartyA: formattedPhone,
                PartyB: this.businessShortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: this.callbackUrl,
                AccountReference: accountReference,
                TransactionDesc: `Payment for booking #${bookingId}`
            };

            const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, stkPushData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Save STK push request to database
            await this.saveSTKPushRequest(bookingId, response.data, formattedPhone, amount);

            return {
                success: true,
                checkoutRequestId: response.data.CheckoutRequestID,
                merchantRequestId: response.data.MerchantRequestID,
                responseCode: response.data.ResponseCode,
                responseDescription: response.data.ResponseDescription,
                customerMessage: response.data.CustomerMessage
            };

        } catch (error) {
            console.error('STK Push error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessage || 'Payment initiation failed'
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
        } catch (error) {
            console.error('Error saving STK push request:', error);
        }
    }

    // Check STK Push status
    async checkSTKPushStatus(checkoutRequestId) {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = this.generateTimestamp();
            const password = this.generatePassword(timestamp);

            const queryData = {
                BusinessShortCode: this.businessShortCode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            };

            const response = await axios.post(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, queryData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('STK Push query error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Process M-Pesa callback
    async processCallback(callbackData) {
        try {
            const connection = await createConnection();
            
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
                // Update booking payment status
                const [mpesaRequest] = await connection.execute(
                    'SELECT booking_id FROM mpesa_requests WHERE checkout_request_id = ?',
                    [callbackData.CheckoutRequestID]
                );

                if (mpesaRequest.length > 0) {
                    const bookingId = mpesaRequest[0].booking_id;
                    
                    // Update booking status to paid
                    await connection.execute(
                        'UPDATE bookings SET payment_status = "paid" WHERE id = ?',
                        [bookingId]
                    );

                    // Create payment record
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

                    console.log(`Payment completed for booking #${bookingId}`);
                }
            }

            await connection.end();
            return { success: true };
        } catch (error) {
            console.error('Error processing M-Pesa callback:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new MpesaService();