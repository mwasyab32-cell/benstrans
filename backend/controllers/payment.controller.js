const { createConnection } = require('../config/db');

// Automatically choose payment service based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const mpesaService = isDevelopment 
    ? require('../services/mock-mpesa.service')
    : require('../services/mpesa.service');

console.log(`💳 Using ${isDevelopment ? 'Mock' : 'Real'} M-Pesa Service`);

// Initiate payment for a booking
const initiatePayment = async (req, res) => {
    try {
        const { booking_id, phone_number } = req.body;
        const client_id = req.user.id;
        
        const connection = await createConnection();
        
        // Get booking details and verify ownership
        const [bookings] = await connection.execute(`
            SELECT b.*, t.travel_date, t.departure_time, v.vehicle_number, v.route_from, v.route_to, v.price
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            WHERE b.id = ? AND b.client_id = ?
        `, [booking_id, client_id]);
        
        if (bookings.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookings[0];
        
        // Check if already paid
        if (booking.payment_status === 'paid') {
            await connection.end();
            return res.status(400).json({ error: 'Booking already paid' });
        }
        
        // Calculate total amount
        const totalAmount = booking.seats_booked * booking.price;
        
        // Properly format the travel datetime
        const travelDate = new Date(booking.travel_date);
        const [hours, minutes, seconds] = booking.departure_time.split(':');
        travelDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
        
        // Set payment deadline (24 hours before travel)
        const paymentDeadline = new Date(travelDate.getTime() - (24 * 60 * 60 * 1000));
        
        // Format payment deadline for MySQL
        const formattedPaymentDeadline = paymentDeadline.toISOString().slice(0, 19).replace('T', ' ');
        
        // Check if payment deadline has passed
        if (new Date() > paymentDeadline) {
            await connection.end();
            return res.status(400).json({ 
                error: 'Payment deadline has passed. Payment must be made at least 24 hours before travel.' 
            });
        }
        
        // Update booking with payment details
        await connection.execute(`
            UPDATE bookings 
            SET total_amount = ?, payment_deadline = ?, payment_method = 'mpesa'
            WHERE id = ?
        `, [totalAmount, formattedPaymentDeadline, booking_id]);
        
        await connection.end();
        
        // Initiate M-Pesa STK Push
        const paymentResult = await mpesaService.initiateSTKPush(
            phone_number,
            totalAmount,
            booking_id,
            `Bens Trans - ${booking.route_from} to ${booking.route_to}`
        );
        
        if (paymentResult.success) {
            res.json({
                success: true,
                message: 'Payment request sent to your phone. Please enter your M-Pesa PIN to complete payment.',
                checkoutRequestId: paymentResult.checkoutRequestId,
                amount: totalAmount,
                paymentDeadline: paymentDeadline.toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                error: paymentResult.error
            });
        }
        
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ error: 'Payment initiation failed' });
    }
};

// Check payment status
const checkPaymentStatus = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const client_id = req.user.id;
        
        const connection = await createConnection();
        
        // Get booking and payment status
        const [bookings] = await connection.execute(`
            SELECT b.payment_status, b.total_amount, b.payment_deadline,
                   p.mpesa_receipt_number, p.status as payment_record_status,
                   mr.checkout_request_id, mr.status as mpesa_status
            FROM bookings b
            LEFT JOIN payments p ON b.id = p.booking_id
            LEFT JOIN mpesa_requests mr ON b.id = mr.booking_id
            WHERE b.id = ? AND b.client_id = ?
            ORDER BY p.created_at DESC, mr.created_at DESC
            LIMIT 1
        `, [booking_id, client_id]);
        
        if (bookings.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookings[0];
        await connection.end();
        
        res.json({
            payment_status: booking.payment_status,
            total_amount: booking.total_amount,
            payment_deadline: booking.payment_deadline,
            mpesa_receipt_number: booking.mpesa_receipt_number,
            checkout_request_id: booking.checkout_request_id
        });
        
    } catch (error) {
        console.error('Payment status check error:', error);
        res.status(500).json({ error: 'Failed to check payment status' });
    }
};

// M-Pesa callback handler
const mpesaCallback = async (req, res) => {
    try {
        console.log('M-Pesa callback received:', JSON.stringify(req.body, null, 2));
        
        const callbackData = req.body.Body?.stkCallback;
        
        if (callbackData) {
            await mpesaService.processCallback(callbackData);
        }
        
        // Always respond with success to M-Pesa
        res.json({ ResultCode: 0, ResultDesc: 'Success' });
        
    } catch (error) {
        console.error('M-Pesa callback error:', error);
        res.json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
    }
};

// Get payment history for a user
const getPaymentHistory = async (req, res) => {
    try {
        const client_id = req.user.id;
        const connection = await createConnection();
        
        const [payments] = await connection.execute(`
            SELECT p.*, b.seats_booked, t.travel_date, t.departure_time,
                   v.vehicle_number, v.route_from, v.route_to, v.price
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            WHERE b.client_id = ?
            ORDER BY p.created_at DESC
        `, [client_id]);
        
        await connection.end();
        res.json(payments);
        
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ error: 'Failed to get payment history' });
    }
};

// Cancel unpaid booking
const cancelBooking = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const client_id = req.user.id;
        
        const connection = await createConnection();
        
        // Check if booking exists and is unpaid
        const [bookings] = await connection.execute(`
            SELECT payment_status, payment_deadline 
            FROM bookings 
            WHERE id = ? AND client_id = ?
        `, [booking_id, client_id]);
        
        if (bookings.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        if (bookings[0].payment_status === 'paid') {
            await connection.end();
            return res.status(400).json({ error: 'Cannot cancel paid booking' });
        }
        
        // Delete the booking (this will free up the seats)
        await connection.execute('DELETE FROM bookings WHERE id = ?', [booking_id]);
        
        await connection.end();
        res.json({ message: 'Booking cancelled successfully' });
        
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

module.exports = {
    initiatePayment,
    checkPaymentStatus,
    mpesaCallback,
    getPaymentHistory,
    cancelBooking
};