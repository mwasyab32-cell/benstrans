const { createConnection } = require('./config/db');

async function testReceipt() {
    try {
        const connection = await createConnection();
        
        // Get the most recent booking with a reference number
        const [bookings] = await connection.execute(`
            SELECT b.*, t.travel_date, t.departure_time, v.vehicle_number, v.route_from, v.route_to, v.price,
                   p.mpesa_receipt_number, u.name as client_name, u.email as client_email, u.phone as client_phone
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN payments p ON b.id = p.booking_id
            LEFT JOIN users u ON b.client_id = u.id
            WHERE b.reference_number IS NOT NULL
            ORDER BY b.booking_date DESC
            LIMIT 5
        `);
        
        console.log('\n=== Recent Bookings with Reference Numbers ===\n');
        
        if (bookings.length === 0) {
            console.log('❌ No bookings found with reference numbers');
            console.log('\nTo test the receipt feature:');
            console.log('1. Make a booking through the book-now.html page');
            console.log('2. The booking will generate a reference number (e.g., BT1739664000123)');
            console.log('3. Use that reference number to test the receipt');
        } else {
            bookings.forEach((booking, index) => {
                console.log(`${index + 1}. Reference: ${booking.reference_number}`);
                console.log(`   Customer: ${booking.customer_name || booking.client_name || 'N/A'}`);
                console.log(`   Route: ${booking.route_from} → ${booking.route_to}`);
                console.log(`   Date: ${booking.travel_date}`);
                console.log(`   Seats: ${booking.seats_booked}`);
                console.log(`   Seat Numbers: ${booking.seat_numbers || 'Not assigned'}`);
                console.log(`   Total: KSh ${booking.total_amount}`);
                console.log(`   Status: ${booking.payment_status}`);
                console.log(`   Receipt URL: http://localhost:3000/receipt.html?ref=${booking.reference_number}`);
                console.log('');
            });
            
            console.log('\n✅ Test these receipt URLs in your browser!');
        }
        
        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testReceipt();
