// SMS Service for sending booking notifications
// Integrated with Africa's Talking SMS Gateway

const { createConnection } = require('../config/db');

const sendSMS = async (phoneNumber, message) => {
    try {
        console.log('\n========================================');
        console.log('📱 SMS SERVICE CALLED');
        console.log('========================================');
        console.log('Phone Number:', phoneNumber);
        console.log('SMS_ENABLED:', process.env.SMS_ENABLED);
        console.log('========================================\n');
        
        // Check if we're in production mode with real credentials
        const useRealSMS = process.env.SMS_ENABLED === 'true';
        
        if (useRealSMS) {
            // Production: Use Africa's Talking
            const AfricasTalking = require('africastalking');
            
            if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
                console.error('❌ Africa\'s Talking credentials not configured');
                return { success: false, error: 'SMS credentials not configured' };
            }
            
            const africastalking = AfricasTalking({
                apiKey: process.env.AFRICASTALKING_API_KEY,
                username: process.env.AFRICASTALKING_USERNAME
            });
            
            const sms = africastalking.SMS;
            
            // Format phone number (ensure it starts with +254)
            let formattedPhone = phoneNumber;
            if (phoneNumber.startsWith('0')) {
                formattedPhone = '+254' + phoneNumber.substring(1);
            } else if (phoneNumber.startsWith('254')) {
                formattedPhone = '+' + phoneNumber;
            } else if (!phoneNumber.startsWith('+')) {
                formattedPhone = '+254' + phoneNumber;
            }
            
            console.log('✅ Sending SMS via Africa\'s Talking to:', formattedPhone);
            
            const smsOptions = {
                to: [formattedPhone],
                message: message
            };
            
            // Only add sender ID if it's provided and not empty
            if (process.env.SMS_SENDER_ID && process.env.SMS_SENDER_ID.trim() !== '') {
                smsOptions.from = process.env.SMS_SENDER_ID;
                console.log('Using Sender ID:', process.env.SMS_SENDER_ID);
            } else {
                console.log('Using default sender ID (no custom sender ID set)');
            }
            
            const result = await sms.send(smsOptions);
            
            console.log('✅ SMS sent successfully:', JSON.stringify(result, null, 2));
            
            // Log recipient details for debugging
            if (result.SMSMessageData && result.SMSMessageData.Recipients) {
                console.log('📋 Recipient Details:');
                result.SMSMessageData.Recipients.forEach((recipient, index) => {
                    console.log(`  Recipient ${index + 1}:`, JSON.stringify(recipient, null, 2));
                });
            }
            
            // Save to database
            try {
                const connection = await createConnection();
                
                // Extract message ID and cost from first recipient
                let messageId = null;
                let cost = null;
                let status = 'sent';
                
                if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
                    const recipient = result.SMSMessageData.Recipients[0];
                    messageId = recipient.messageId;
                    cost = recipient.cost;
                    status = recipient.status === 'Success' ? 'sent' : 'failed';
                }
                
                await connection.execute(
                    `INSERT INTO sms_logs (phone_number, message, message_id, status, cost) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [formattedPhone, message, messageId, status, cost]
                );
                
                await connection.end();
                console.log('📝 SMS logged to database');
            } catch (dbError) {
                console.error('⚠️  Failed to log SMS to database:', dbError.message);
                // Don't fail the SMS send if logging fails
            }
            
            return {
                success: true,
                message: 'SMS sent successfully',
                recipient: formattedPhone,
                result: result
            };
        } else {
            // Development/Testing: Mock SMS (log to console)
            console.log('╔════════════════════════════════════════╗');
            console.log('║   📱 SMS NOTIFICATION (MOCK MODE)     ║');
            console.log('╚════════════════════════════════════════╝');
            console.log('To:', phoneNumber);
            console.log('─────────────────────────────────────────');
            console.log(message);
            console.log('─────────────────────────────────────────');
            console.log('✅ SMS logged successfully (mock mode)');
            console.log('ℹ️  To send real SMS, set SMS_ENABLED=true in .env\n');
            
            return {
                success: true,
                message: 'SMS sent successfully (mock mode)',
                recipient: phoneNumber
            };
        }
    } catch (error) {
        console.error('❌ SMS sending error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const sendBookingConfirmation = async (phoneNumber, bookingDetails) => {
    const message = `Bens Trans Booking Confirmed!\n` +
                   `Ref: ${bookingDetails.reference_number}\n` +
                   `Route: ${bookingDetails.route_from} to ${bookingDetails.route_to}\n` +
                   `Date: ${bookingDetails.travel_date}\n` +
                   `Time: ${bookingDetails.departure_time}\n` +
                   `Seats: ${bookingDetails.seats_booked}\n` +
                   `Amount: KSh ${bookingDetails.total_amount}\n` +
                   `Vehicle: ${bookingDetails.vehicle_number}\n` +
                   `Pay before: ${bookingDetails.payment_deadline}\n` +
                   `Thank you for choosing Bens Trans!`;
    
    return await sendSMS(phoneNumber, message);
};

const sendPaymentConfirmation = async (phoneNumber, paymentDetails) => {
    const message = `Bens Trans Payment Received!\n` +
                   `Receipt: ${paymentDetails.mpesa_receipt}\n` +
                   `Amount: KSh ${paymentDetails.amount}\n` +
                   `Ref: ${paymentDetails.reference_number}\n` +
                   `Your booking is confirmed. Safe travels!`;
    
    return await sendSMS(phoneNumber, message);
};

const sendPaymentReminder = async (phoneNumber, reminderDetails) => {
    const message = `Bens Trans Payment Reminder\n` +
                   `Ref: ${reminderDetails.reference_number}\n` +
                   `Amount Due: KSh ${reminderDetails.amount}\n` +
                   `Deadline: ${reminderDetails.deadline}\n` +
                   `Please complete payment to confirm your booking.`;
    
    return await sendSMS(phoneNumber, message);
};

module.exports = {
    sendSMS,
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendPaymentReminder
};
