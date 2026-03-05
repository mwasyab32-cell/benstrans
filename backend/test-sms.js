// Test SMS functionality
require('dotenv').config();
const { sendBookingConfirmation, sendPaymentConfirmation, sendSMS } = require('./services/sms.service');

async function testSMS() {
    console.log('=== SMS Service Test ===\n');
    
    // Check configuration
    console.log('Configuration:');
    console.log('SMS_ENABLED:', process.env.SMS_ENABLED);
    console.log('AFRICASTALKING_USERNAME:', process.env.AFRICASTALKING_USERNAME ? '✓ Set' : '✗ Not set');
    console.log('AFRICASTALKING_API_KEY:', process.env.AFRICASTALKING_API_KEY ? '✓ Set' : '✗ Not set');
    console.log('SMS_SENDER_ID:', process.env.SMS_SENDER_ID || 'Not set (will use default)');
    console.log('\n');
    
    // Test phone number (replace with your actual test number)
    const testPhone = '0712345678'; // Replace with your phone number
    
    console.log('Test 1: Simple SMS');
    console.log('-------------------');
    const result1 = await sendSMS(testPhone, 'Test message from Bens Trans booking system!');
    console.log('Result:', result1);
    console.log('\n');
    
    console.log('Test 2: Booking Confirmation SMS');
    console.log('----------------------------------');
    const bookingDetails = {
        reference_number: 'BT' + Date.now(),
        route_from: 'Nairobi',
        route_to: 'Mombasa',
        travel_date: '15/03/2026',
        departure_time: '08:00',
        seats_booked: 2,
        total_amount: 2000,
        vehicle_number: 'KAA 123B',
        payment_deadline: '14/03/2026'
    };
    
    const result2 = await sendBookingConfirmation(testPhone, bookingDetails);
    console.log('Result:', result2);
    console.log('\n');
    
    console.log('Test 3: Payment Confirmation SMS');
    console.log('----------------------------------');
    const paymentDetails = {
        mpesa_receipt: 'ABC123XYZ',
        amount: 2000,
        reference_number: 'BT' + Date.now()
    };
    
    const result3 = await sendPaymentConfirmation(testPhone, paymentDetails);
    console.log('Result:', result3);
    console.log('\n');
    
    console.log('=== Test Complete ===');
    console.log('\nNotes:');
    if (process.env.SMS_ENABLED === 'true') {
        console.log('✓ Real SMS mode enabled - messages were sent to', testPhone);
        console.log('✓ Check your phone for received messages');
        console.log('✓ Check Africa\'s Talking dashboard for delivery status');
    } else {
        console.log('ℹ Mock mode enabled - no real SMS sent');
        console.log('ℹ Set SMS_ENABLED=true in .env to send real SMS');
        console.log('ℹ Add your Africa\'s Talking credentials to .env');
    }
}

// Run the test
testSMS().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
