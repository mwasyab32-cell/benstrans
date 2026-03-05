const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function ensureVehiclesAvailable() {
    try {
        const connection = await createConnection();
        
        // 1. Create approved vehicle owners if they don't exist
        const [owners] = await connection.execute('SELECT * FROM users WHERE role = "owner" AND status = "approved"');
        
        if (owners.length === 0) {
            console.log('Creating approved vehicle owners...');
            const hashedPassword = await bcrypt.hash('owner123', 10);
            
            const ownerData = [
                ['John Matatu', 'john@benstrans.com', '0701234567'],
                ['Mary Shuttle', 'mary@benstrans.com', '0702345678'],
                ['Peter Bus', 'peter@benstrans.com', '0703456789']
            ];
            
            for (const [name, email, phone] of ownerData) {
                await connection.execute(
                    'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, email, phone, hashedPassword, 'owner', 'approved']
                );
            }
            console.log('Created 3 approved vehicle owners');
        }
        
        // 2. Get approved owners
        const [approvedOwners] = await connection.execute('SELECT * FROM users WHERE role = "owner" AND status = "approved"');
        
        // 3. Create approved vehicles for popular routes if they don't exist
        const routes = [
            ['Nairobi', 'Mombasa'],
            ['Nairobi', 'Kisumu'],
            ['Nairobi', 'Nakuru'],
            ['Mombasa', 'Nairobi'],
            ['Kisumu', 'Nairobi'],
            ['Nakuru', 'Nairobi'],
            ['Nairobi', 'Eldoret'],
            ['Eldoret', 'Nairobi']
        ];
        
        let vehiclesCreated = 0;
        for (let i = 0; i < routes.length; i++) {
            const [from, to] = routes[i];
            const owner = approvedOwners[i % approvedOwners.length];
            
            // Check if vehicle exists for this route
            const [existing] = await connection.execute(
                'SELECT * FROM vehicles WHERE route_from = ? AND route_to = ? AND status = "approved"',
                [from, to]
            );
            
            if (existing.length === 0) {
                const vehicleNumber = `KCA ${String(100 + i).padStart(3, '0')}A`;
                const vehicleType = i % 2 === 0 ? 'bus' : 'shuttle';
                const totalSeats = vehicleType === 'bus' ? 50 : 14;
                const price = from === 'Nairobi' && to === 'Mombasa' ? 1500 : 
                             from === 'Mombasa' && to === 'Nairobi' ? 1500 :
                             from === 'Nairobi' && to === 'Kisumu' ? 1200 :
                             from === 'Kisumu' && to === 'Nairobi' ? 1200 : 800;
                
                await connection.execute(
                    'INSERT INTO vehicles (owner_id, vehicle_number, vehicle_type, route_from, route_to, total_seats, price, registration_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [owner.id, vehicleNumber, vehicleType, from, to, totalSeats, price, vehicleType === 'bus' ? 5000 : 3000, 'approved']
                );
                vehiclesCreated++;
            }
        }
        
        console.log(`Created ${vehiclesCreated} new approved vehicles`);
        
        // 4. Generate trips for the next 30 days for all approved vehicles
        const [vehicles] = await connection.execute('SELECT * FROM vehicles WHERE status = "approved"');
        const today = new Date();
        const defaultTimes = ['06:00:00', '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00'];
        
        let tripsCreated = 0;
        for (let day = 0; day < 30; day++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + day);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            for (const vehicle of vehicles) {
                for (const time of defaultTimes) {
                    // Check if trip already exists
                    const [existing] = await connection.execute(
                        'SELECT id FROM trips WHERE vehicle_id = ? AND travel_date = ? AND departure_time = ?',
                        [vehicle.id, dateStr, time]
                    );
                    
                    if (existing.length === 0) {
                        await connection.execute(
                            'INSERT INTO trips (vehicle_id, travel_date, departure_time, available_seats) VALUES (?, ?, ?, ?)',
                            [vehicle.id, dateStr, time, vehicle.total_seats]
                        );
                        tripsCreated++;
                    }
                }
            }
        }
        
        console.log(`Created ${tripsCreated} new trips`);
        
        // 5. Summary
        const [finalVehicles] = await connection.execute('SELECT COUNT(*) as count FROM vehicles WHERE status = "approved"');
        const [finalTrips] = await connection.execute('SELECT COUNT(*) as count FROM trips WHERE travel_date >= CURDATE()');
        
        console.log('\n=== VEHICLE AVAILABILITY SUMMARY ===');
        console.log(`✅ Approved vehicles: ${finalVehicles[0].count}`);
        console.log(`✅ Available trips: ${finalTrips[0].count}`);
        console.log('✅ Vehicles are now available for all routes and dates!');
        
        await connection.end();
    } catch (error) {
        console.error('Error ensuring vehicles available:', error);
    }
}

// Run if called directly
if (require.main === module) {
    ensureVehiclesAvailable();
}

module.exports = { ensureVehiclesAvailable };