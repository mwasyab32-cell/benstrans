const { createConnection } = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendBookingConfirmation } = require('../services/sms.service');

// Guest booking (no authentication required)
const createGuestBooking = async (req, res) => {
    try {
        const { trip_id, seats_booked, seat_numbers, customer_name, customer_email, customer_phone, customer_id_number } = req.body;
        
        // Validate required fields
        if (!trip_id || !seats_booked || !customer_name || !customer_email || !customer_phone || !customer_id_number) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate phone number (10 digits)
        if (!/^[0-9]{10}$/.test(customer_phone)) {
            return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
        }
        
        // Validate ID number (8 digits)
        if (!/^[0-9]{8}$/.test(customer_id_number)) {
            return res.status(400).json({ error: 'ID number must be exactly 8 digits' });
        }
        
        const connection = await createConnection();
        await connection.beginTransaction();
        
        try {
            // Check if user already exists
            const [existingUsers] = await connection.execute(
                'SELECT id, role FROM users WHERE email = ?',
                [customer_email]
            );
            
            let userId = null;
            let accountCreated = false;
            
            if (existingUsers.length > 0) {
                // User exists, use their ID
                userId = existingUsers[0].id;
            } else {
                // Create new client account automatically with ID number as password
                const defaultPassword = await bcrypt.hash(customer_id_number, 10); // Use ID number as password
                
                const [userResult] = await connection.execute(
                    'INSERT INTO users (name, email, phone, id_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [customer_name, customer_email, customer_phone, customer_id_number, defaultPassword, 'client', 'approved']
                );
                
                userId = userResult.insertId;
                accountCreated = true;
            }
            
            // Get trip details
            const [trips] = await connection.execute(`
                SELECT t.*, v.price, v.route_from, v.route_to, v.vehicle_number,
                       (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
                FROM trips t
                JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
                WHERE t.id = ?
                GROUP BY t.id
            `, [trip_id]);
            
            if (trips.length === 0) {
                await connection.rollback();
                await connection.end();
                return res.status(404).json({ error: 'Trip not found' });
            }
            
            const trip = trips[0];
            
            if (trip.remaining_seats < seats_booked) {
                await connection.rollback();
                await connection.end();
                return res.status(400).json({ error: 'Not enough seats available' });
            }
            
            // Calculate total and payment deadline
            const totalAmount = seats_booked * trip.price;
            const travelDate = new Date(trip.travel_date);
            const [hours, minutes] = trip.departure_time.split(':');
            travelDate.setHours(parseInt(hours), parseInt(minutes), 0);
            
            const paymentDeadline = new Date(travelDate.getTime() - (24 * 60 * 60 * 1000));
            const now = new Date();
            
            if (paymentDeadline <= now) {
                await connection.rollback();
                await connection.end();
                return res.status(400).json({ 
                    error: 'Booking deadline has passed. Bookings must be made at least 24 hours before travel.' 
                });
            }
            
            const formattedPaymentDeadline = paymentDeadline.toISOString().slice(0, 19).replace('T', ' ');
            
            // Generate reference number
            const referenceNumber = 'BT' + Date.now() + Math.floor(Math.random() * 1000);
            
            // Store seat numbers as JSON string
            const seatNumbersJson = seat_numbers ? JSON.stringify(seat_numbers) : null;
            
            // Create booking with client_id (matching existing column name)
            const [result] = await connection.execute(`
                INSERT INTO bookings 
                (client_id, trip_id, seats_booked, seat_numbers, total_amount, payment_status, payment_method, payment_deadline,
                 customer_name, customer_email, customer_phone, customer_id_number, reference_number) 
                VALUES (?, ?, ?, ?, ?, 'pending', 'mpesa', ?, ?, ?, ?, ?, ?)
            `, [userId, trip_id, seats_booked, seatNumbersJson, totalAmount, formattedPaymentDeadline, 
                customer_name, customer_email, customer_phone, customer_id_number, referenceNumber]);
            
            await connection.commit();
            await connection.end();
            
            // Send SMS notification
            console.log('📱 Preparing to send SMS notification...');
            const smsDetails = {
                customer_name: customer_name,
                reference_number: referenceNumber,
                route_from: trip.route_from,
                route_to: trip.route_to,
                travel_date: new Date(trip.travel_date).toLocaleDateString(),
                departure_time: trip.departure_time,
                seats_booked: seats_booked,
                total_amount: totalAmount,
                vehicle_number: trip.vehicle_number,
                payment_deadline: paymentDeadline.toLocaleDateString()
            };
            
            console.log('SMS Details:', smsDetails);
            console.log('Customer Phone:', customer_phone);
            
            // Send SMS asynchronously (don't wait for it)
            sendBookingConfirmation(customer_phone, smsDetails)
                .then(result => {
                    console.log('✅ SMS notification result:', result);
                })
                .catch(err => {
                    console.error('❌ Failed to send SMS notification:', err);
                });
            
            res.status(201).json({ 
                success: true,
                message: 'Booking created successfully' + (accountCreated ? '. A client account has been created for you. Login with your email and ID number to view your bookings.' : '') + '. Confirmation SMS sent to ' + customer_phone,
                account_created: accountCreated,
                login_info: accountCreated ? {
                    email: customer_email,
                    password_hint: 'Use your ID number as password'
                } : null,
                booking: {
                    id: result.insertId,
                    reference_number: referenceNumber,
                    seat_numbers: seat_numbers,
                    total_amount: totalAmount,
                    payment_deadline: paymentDeadline.toISOString(),
                    trip_details: {
                        vehicle_number: trip.vehicle_number,
                        route_from: trip.route_from,
                        route_to: trip.route_to,
                        travel_date: trip.travel_date,
                        departure_time: trip.departure_time
                    }
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Guest booking error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createBooking = async (req, res) => {
    try {
        const { trip_id, seats_booked, phone_number } = req.body;
        const client_id = req.user.id;
        const connection = await createConnection();
        
        await connection.beginTransaction();
        
        // Get trip details and check available seats
        const [trips] = await connection.execute(`
            SELECT t.*, v.price, v.route_from, v.route_to, v.vehicle_number,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status = 'paid'
            WHERE t.id = ?
            GROUP BY t.id
        `, [trip_id]);
        
        if (trips.length === 0) {
            await connection.rollback();
            await connection.end();
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        const trip = trips[0];
        
        if (trip.remaining_seats < seats_booked) {
            await connection.rollback();
            await connection.end();
            return res.status(400).json({ error: 'Not enough seats available' });
        }
        
        // Calculate total amount and payment deadline
        const totalAmount = seats_booked * trip.price;
        
        // Properly format the travel datetime
        const travelDate = new Date(trip.travel_date);
        const [hours, minutes, seconds] = trip.departure_time.split(':');
        travelDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
        
        // Calculate payment deadline (24 hours before travel)
        const paymentDeadline = new Date(travelDate.getTime() - (24 * 60 * 60 * 1000));
        
        // Ensure payment deadline is not in the past
        const now = new Date();
        if (paymentDeadline <= now) {
            await connection.rollback();
            await connection.end();
            return res.status(400).json({ 
                error: 'Booking deadline has passed. Bookings must be made at least 24 hours before travel.' 
            });
        }
        
        // Format payment deadline for MySQL (YYYY-MM-DD HH:MM:SS)
        const formattedPaymentDeadline = paymentDeadline.toISOString().slice(0, 19).replace('T', ' ');
        
        // Create booking with pending payment status
        const [result] = await connection.execute(`
            INSERT INTO bookings 
            (client_id, trip_id, seats_booked, total_amount, payment_status, payment_method, payment_deadline) 
            VALUES (?, ?, ?, ?, 'pending', 'mpesa', ?)
        `, [client_id, trip_id, seats_booked, totalAmount, formattedPaymentDeadline]);
        
        await connection.commit();
        await connection.end();
        
        const bookingId = result.insertId;
        
        // Return booking details for payment initiation
        res.status(201).json({ 
            success: true,
            message: 'Booking created successfully. Please proceed with payment.',
            booking: {
                id: bookingId,
                trip_id: trip_id,
                seats_booked: seats_booked,
                total_amount: totalAmount,
                payment_deadline: paymentDeadline.toISOString(),
                payment_status: 'pending',
                trip_details: {
                    vehicle_number: trip.vehicle_number,
                    route_from: trip.route_from,
                    route_to: trip.route_to,
                    travel_date: trip.travel_date,
                    departure_time: trip.departure_time,
                    price_per_seat: trip.price
                }
            }
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const client_id = req.user.id;
        const connection = await createConnection();
        
        const [bookings] = await connection.execute(`
            SELECT b.*, t.travel_date, t.departure_time, v.vehicle_number, v.route_from, v.route_to, v.price,
                   p.mpesa_receipt_number, p.status as payment_record_status
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE b.client_id = ?
            ORDER BY b.booking_date DESC
        `, [client_id]);
        
        await connection.end();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get receipt by reference number (no authentication required)
const getReceipt = async (req, res) => {
    try {
        const { reference_number } = req.params;
        const connection = await createConnection();
        
        const [bookings] = await connection.execute(`
            SELECT b.*, t.travel_date, t.departure_time, v.vehicle_number, v.route_from, v.route_to, v.price,
                   p.mpesa_receipt_number, u.name as client_name, u.email as client_email, u.phone as client_phone
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN payments p ON b.id = p.booking_id
            LEFT JOIN users u ON b.client_id = u.id
            WHERE b.reference_number = ?
        `, [reference_number]);
        
        await connection.end();
        
        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        
        res.json(bookings[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createBooking, getMyBookings, createGuestBooking, getReceipt };