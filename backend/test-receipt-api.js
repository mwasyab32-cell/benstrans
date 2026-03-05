const { createConnection } = require('./config/db');

async function testReceiptAPI() {
    try {
        const reference_number = 'BT1771153486470225'; // Use the most recent one
        const connection = await createConnection();
        
        console.log(`\n=== Testing Receipt API for ${reference_number} ===\n`);
        
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
        
        if (bookings.length === 0) {
            console.log('❌ No booking found');
        } else {
            console.log('✅ Booking found!');
            console.log('\nData that will be returned:');
            console.log(JSON.stringify(bookings[0], null, 2));
        }
        
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testReceiptAPI();
