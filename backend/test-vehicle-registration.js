const { createConnection } = require('./config/db');

async function testVehicleRegistration() {
    console.log('🧪 Testing Vehicle Registration Process...\n');
    
    try {
        const connection = await createConnection();
        
        // Check if we have approved owners
        const [owners] = await connection.execute(
            'SELECT id, name, email FROM users WHERE role = "owner" AND status = "approved" LIMIT 1'
        );
        
        if (owners.length === 0) {
            console.log('❌ No approved owners found. Creating test owner...');
            
            // Create a test owner
            await connection.execute(
                'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Test Owner', 'testowner@example.com', '0700000000', 'hashedpassword', 'owner', 'approved']
            );
            
            console.log('✅ Test owner created');
        } else {
            console.log('✅ Found approved owner:', owners[0].name);
        }
        
        // Get the owner ID
        const [ownerData] = await connection.execute(
            'SELECT id FROM users WHERE role = "owner" AND status = "approved" LIMIT 1'
        );
        const ownerId = ownerData[0].id;
        
        // Test vehicle registration
        console.log('\n📝 Testing vehicle registration...');
        
        const testVehicle = {
            owner_id: ownerId,
            vehicle_number: 'TEST-001',
            vehicle_type: 'bus',
            route_from: 'Nairobi',
            route_to: 'Mombasa',
            total_seats: 50,
            price: 1500.00,
            registration_fee: 5000,
            status: 'pending'
        };
        
        // Check if test vehicle already exists
        const [existing] = await connection.execute(
            'SELECT id FROM vehicles WHERE vehicle_number = ?',
            [testVehicle.vehicle_number]
        );
        
        if (existing.length > 0) {
            console.log('⚠️ Test vehicle already exists, deleting...');
            await connection.execute('DELETE FROM vehicles WHERE vehicle_number = ?', [testVehicle.vehicle_number]);
        }
        
        // Insert test vehicle
        const [result] = await connection.execute(
            'INSERT INTO vehicles (owner_id, vehicle_number, vehicle_type, route_from, route_to, total_seats, price, registration_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [testVehicle.owner_id, testVehicle.vehicle_number, testVehicle.vehicle_type, testVehicle.route_from, testVehicle.route_to, testVehicle.total_seats, testVehicle.price, testVehicle.registration_fee, testVehicle.status]
        );
        
        console.log('✅ Test vehicle registered with ID:', result.insertId);
        
        // Verify the vehicle was inserted
        const [vehicles] = await connection.execute(
            'SELECT v.*, u.name as owner_name FROM vehicles v JOIN users u ON v.owner_id = u.id WHERE v.id = ?',
            [result.insertId]
        );
        
        if (vehicles.length > 0) {
            console.log('✅ Vehicle verification successful:');
            console.log('   Vehicle Number:', vehicles[0].vehicle_number);
            console.log('   Owner:', vehicles[0].owner_name);
            console.log('   Status:', vehicles[0].status);
            console.log('   Registration Fee:', vehicles[0].registration_fee);
        }
        
        // Check pending vehicles for admin
        const [pendingVehicles] = await connection.execute(`
            SELECT v.*, u.name as owner_name, u.email as owner_email,
                   DATE_FORMAT(v.created_at, "%Y-%m-%d %H:%i") as registration_date
            FROM vehicles v
            JOIN users u ON v.owner_id = u.id
            WHERE v.status = "pending"
            ORDER BY v.created_at DESC
        `);
        
        console.log('\n📋 Pending vehicles for admin approval:');
        if (pendingVehicles.length === 0) {
            console.log('   No pending vehicles found');
        } else {
            pendingVehicles.forEach((vehicle, index) => {
                console.log(`   ${index + 1}. ${vehicle.vehicle_number} (${vehicle.owner_name}) - ${vehicle.status}`);
            });
        }
        
        await connection.end();
        
        console.log('\n🎉 Vehicle registration test completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Login as owner and register a vehicle');
        console.log('2. Check that vehicle appears with "PENDING ADMIN APPROVAL" status');
        console.log('3. Login as admin and approve the vehicle');
        console.log('4. Verify vehicle status changes to "APPROVED"');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testVehicleRegistration();