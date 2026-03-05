const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function testGuestBooking() {
    try {
        console.log('Testing guest booking with auto account creation...\n');
        
        const connection = await createConnection();
        
        // Test data
        const testData = {
            customer_name: 'Test User',
            customer_email: 'testuser' + Date.now() + '@example.com',
            customer_phone: '0712345678',
            customer_id_number: '12345678'
        };
        
        console.log('1. Testing user creation...');
        
        // Check if bcrypt is available
        try {
            const hashedPassword = await bcrypt.hash('password123', 10);
            console.log('✅ bcrypt is working');
        } catch (error) {
            console.error('❌ bcrypt error:', error.message);
            await connection.end();
            return;
        }
        
        // Test user creation
        try {
            const defaultPassword = await bcrypt.hash('password123', 10);
            
            const [userResult] = await connection.execute(
                'INSERT INTO users (name, email, phone, id_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [testData.customer_name, testData.customer_email, testData.customer_phone, 
                 testData.customer_id_number, defaultPassword, 'client', 'approved']
            );
            
            console.log('✅ User created with ID:', userResult.insertId);
            
            // Clean up test user
            await connection.execute('DELETE FROM users WHERE id = ?', [userResult.insertId]);
            console.log('✅ Test user cleaned up');
            
        } catch (error) {
            console.error('❌ User creation error:', error.message);
            console.error('   SQL State:', error.sqlState);
            console.error('   Error Code:', error.code);
        }
        
        // Check if we have any trips to test with
        console.log('\n2. Checking for available trips...');
        const [trips] = await connection.execute('SELECT id FROM trips LIMIT 1');
        
        if (trips.length === 0) {
            console.log('⚠️  No trips found in database. Create a trip first.');
        } else {
            console.log('✅ Found trip ID:', trips[0].id);
        }
        
        await connection.end();
        
        console.log('\n✅ Test complete!');
        console.log('\n📝 If you see errors above, that\'s the issue preventing bookings.');
        console.log('   Most likely: bcrypt module not installed or database schema issue');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testGuestBooking();
