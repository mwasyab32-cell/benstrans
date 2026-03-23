const { createConnection } = require('../config/db');

const registerVehicle = async (req, res) => {
    try {
        console.log('Vehicle registration request received:', req.body);
        console.log('User:', req.user);
        
        const { vehicle_number, route_from, route_to, total_seats, price, vehicle_type } = req.body;
        const owner_id = req.user.id;
        
        // Validate required fields
        if (!vehicle_number || !route_from || !route_to || !total_seats || !price || !vehicle_type) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate owner status
        const connection = await createConnection();
        const [ownerCheck] = await connection.execute(
            'SELECT status FROM users WHERE id = ? AND role = "owner"',
            [owner_id]
        );
        
        if (ownerCheck.length === 0) {
            await connection.end();
            return res.status(403).json({ error: 'Owner account not found' });
        }
        
        if (ownerCheck[0].status !== 'approved') {
            await connection.end();
            return res.status(403).json({ error: 'Owner account must be approved before registering vehicles' });
        }
        
        // Calculate registration charges based on vehicle type
        const registrationCharges = {
            'bus': 5000,      // KSh 5,000 for buses
            'shuttle': 3000   // KSh 3,000 for shuttles
        };
        
        const registrationFee = registrationCharges[vehicle_type.toLowerCase()];
        if (!registrationFee) {
            return res.status(400).json({ error: 'Invalid vehicle type. Must be bus or shuttle' });
        }
        
        // Check if vehicle number already exists
        const [existing] = await connection.execute(
            'SELECT id FROM vehicles WHERE vehicle_number = ?',
            [vehicle_number]
        );
        
        if (existing.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Vehicle number already registered' });
        }
        
        // Auto-approve vehicle upon registration (payment assumed to be made)
        const [result] = await connection.execute(
            'INSERT INTO vehicles (owner_id, vehicle_number, route_from, route_to, total_seats, price, vehicle_type, registration_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "approved")',
            [owner_id, vehicle_number, route_from, route_to, total_seats, price, vehicle_type, registrationFee]
        );
        
        await connection.end();
        console.log('Vehicle registered and auto-approved:', result.insertId);
        res.status(201).json({ 
            message: `Vehicle registered and approved successfully! Registration fee: KSh ${registrationFee}. Your vehicle is now active and available for bookings.`, 
            vehicleId: result.insertId,
            registrationFee: registrationFee,
            status: 'approved'
        });
    } catch (error) {
        console.error('Vehicle registration error:', error);
        res.status(500).json({ error: 'Failed to register vehicle: ' + error.message });
    }
};

const getMyVehicles = async (req, res) => {
    try {
        const owner_id = req.user.id;
        const connection = await createConnection();
        
        const [vehicles] = await connection.execute(
            'SELECT *, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i") as registration_date FROM vehicles WHERE owner_id = ? ORDER BY created_at DESC',
            [owner_id]
        );
        
        await connection.end();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createDailySchedule = async (req, res) => {
    try {
        const { vehicle_id, departure_times, days_of_week } = req.body;
        const owner_id = req.user.id;
        const connection = await createConnection();
        
        // Verify vehicle belongs to owner and is approved
        const [vehicle] = await connection.execute(
            'SELECT id, total_seats, status FROM vehicles WHERE id = ? AND owner_id = ?',
            [vehicle_id, owner_id]
        );
        
        if (vehicle.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        if (vehicle[0].status !== 'approved') {
            await connection.end();
            return res.status(400).json({ error: 'Vehicle must be approved before creating schedules' });
        }
        
        // Create schedule entries
        for (const time of departure_times) {
            for (const day of days_of_week) {
                await connection.execute(
                    'INSERT INTO vehicle_schedules (vehicle_id, departure_time, day_of_week) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE departure_time = VALUES(departure_time)',
                    [vehicle_id, time, day]
                );
            }
        }
        
        await connection.end();
        res.status(201).json({ message: 'Daily schedule created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const generateTripsFromSchedule = async (req, res) => {
    try {
        const connection = await createConnection();
        const today = new Date();
        const futureDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days ahead
        
        // Get all vehicle schedules
        const [schedules] = await connection.execute(`
            SELECT vs.*, v.total_seats, v.owner_id
            FROM vehicle_schedules vs
            JOIN vehicles v ON vs.vehicle_id = v.id
            WHERE v.status = 'approved'
        `);
        
        let tripsCreated = 0;
        
        for (const schedule of schedules) {
            const currentDate = new Date(today);
            
            while (currentDate <= futureDate) {
                const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                
                if (schedule.day_of_week.includes(dayOfWeek.toString())) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    
                    // Check if trip already exists
                    const [existing] = await connection.execute(
                        'SELECT id FROM trips WHERE vehicle_id = ? AND travel_date = ? AND departure_time = ?',
                        [schedule.vehicle_id, dateStr, schedule.departure_time]
                    );
                    
                    if (existing.length === 0) {
                        await connection.execute(
                            'INSERT INTO trips (vehicle_id, travel_date, departure_time, available_seats) VALUES (?, ?, ?, ?)',
                            [schedule.vehicle_id, dateStr, schedule.departure_time, schedule.total_seats]
                        );
                        tripsCreated++;
                    }
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        await connection.end();
        res.json({ message: `Generated ${tripsCreated} trips from schedules` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMyTrips = async (req, res) => {
    try {
        const owner_id = req.user.id;
        const connection = await createConnection();
        
        const [trips] = await connection.execute(`
            SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id
            WHERE v.owner_id = ?
            GROUP BY t.id
            ORDER BY t.travel_date DESC, t.departure_time DESC
        `, [owner_id]);
        
        await connection.end();
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchTrips = async (req, res) => {
    try {
        const { from, to, date } = req.query;

        if (!from || !to || !date) {
            return res.status(400).json({ error: 'from, to and date are required' });
        }

        const connection = await createConnection();

        // Search with case-insensitive partial match
        let [trips] = await connection.execute(`
            SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.total_seats,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
            WHERE LOWER(v.route_from) = LOWER(?) 
              AND LOWER(v.route_to) = LOWER(?) 
              AND t.travel_date = ? 
              AND v.status = 'approved'
            GROUP BY t.id
            HAVING remaining_seats > 0
        `, [from, to, date]);

        // If no trips, auto-generate from approved vehicles on this route
        if (trips.length === 0) {
            const [vehicles] = await connection.execute(`
                SELECT * FROM vehicles 
                WHERE LOWER(route_from) = LOWER(?) AND LOWER(route_to) = LOWER(?) AND status = 'approved'
            `, [from, to]);

            const defaultTimes = ['06:00:00', '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00'];

            for (const vehicle of vehicles) {
                for (const time of defaultTimes) {
                    const [existing] = await connection.execute(
                        'SELECT id FROM trips WHERE vehicle_id = ? AND travel_date = ? AND departure_time = ?',
                        [vehicle.id, date, time]
                    );
                    if (existing.length === 0) {
                        await connection.execute(
                            'INSERT INTO trips (vehicle_id, travel_date, departure_time, available_seats) VALUES (?, ?, ?, ?)',
                            [vehicle.id, date, time, vehicle.total_seats]
                        );
                    }
                }
            }

            [trips] = await connection.execute(`
                SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.total_seats,
                       (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
                FROM trips t
                JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
                WHERE LOWER(v.route_from) = LOWER(?) 
                  AND LOWER(v.route_to) = LOWER(?) 
                  AND t.travel_date = ? 
                  AND v.status = 'approved'
                GROUP BY t.id
                HAVING remaining_seats > 0
            `, [from, to, date]);
        }

        await connection.end();
        console.log(`Found ${trips.length} trips for ${from} → ${to} on ${date}`);
        res.json(trips);
    } catch (error) {
        console.error('Search trips error:', error);
        res.status(500).json({ error: error.message });
    }
};

// New function for flexible search (partial matches, nearby dates)
const searchTripsFlexible = async (req, res) => {
    try {
        const { from, to, date } = req.query;
        const connection = await createConnection();
        
        // Search with partial matching and nearby dates
        const [trips] = await connection.execute(`
            SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.total_seats,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats,
                   DATEDIFF(t.travel_date, ?) as date_diff
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
            WHERE (v.route_from LIKE ? OR v.route_from = ?) 
              AND (v.route_to LIKE ? OR v.route_to = ?)
              AND v.status = 'approved'
              AND t.travel_date BETWEEN DATE_SUB(?, INTERVAL 3 DAY) AND DATE_ADD(?, INTERVAL 7 DAY)
            GROUP BY t.id
            HAVING remaining_seats > 0
            ORDER BY ABS(date_diff), t.departure_time
            LIMIT 20
        `, [date, `%${from}%`, from, `%${to}%`, to, date, date]);
        
        await connection.end();
        console.log(`Flexible search found ${trips.length} trips for ${from} to ${to} around ${date}`);
        res.json(trips);
    } catch (error) {
        console.error('Flexible search error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get booked seats for a trip
const getTripSeats = async (req, res) => {
    try {
        const { trip_id } = req.params;
        const connection = await createConnection();
        
        // Get all bookings for this trip with seat numbers
        const [bookings] = await connection.execute(`
            SELECT seat_numbers 
            FROM bookings 
            WHERE trip_id = ? AND payment_status IN ('paid', 'pending')
            AND seat_numbers IS NOT NULL
        `, [trip_id]);
        
        await connection.end();
        
        // Extract all booked seat numbers
        let bookedSeats = [];
        bookings.forEach(booking => {
            if (booking.seat_numbers) {
                try {
                    const seats = JSON.parse(booking.seat_numbers);
                    bookedSeats = bookedSeats.concat(seats);
                } catch (e) {
                    console.error('Error parsing seat numbers:', e);
                }
            }
        });
        
        res.json({ booked_seats: bookedSeats });
    } catch (error) {
        console.error('Get trip seats error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update vehicle
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_number, route_from, route_to, total_seats, price, vehicle_type } = req.body;
        const owner_id = req.user.id;
        
        const connection = await createConnection();
        
        // Verify vehicle belongs to owner
        const [vehicle] = await connection.execute(
            'SELECT id FROM vehicles WHERE id = ? AND owner_id = ?',
            [id, owner_id]
        );
        
        if (vehicle.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vehicle not found or you do not have permission to edit it' });
        }
        
        // Update vehicle
        await connection.execute(
            'UPDATE vehicles SET vehicle_number = ?, route_from = ?, route_to = ?, total_seats = ?, price = ?, vehicle_type = ? WHERE id = ?',
            [vehicle_number, route_from, route_to, total_seats, price, vehicle_type, id]
        );
        
        await connection.end();
        res.json({ message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const owner_id = req.user.id;
        
        const connection = await createConnection();
        
        // Verify vehicle belongs to owner
        const [vehicle] = await connection.execute(
            'SELECT id FROM vehicles WHERE id = ? AND owner_id = ?',
            [id, owner_id]
        );
        
        if (vehicle.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vehicle not found or you do not have permission to delete it' });
        }
        
        // Check if there are any active bookings
        const [bookings] = await connection.execute(`
            SELECT COUNT(*) as count FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            WHERE t.vehicle_id = ? AND t.travel_date >= CURDATE()
        `, [id]);
        
        if (bookings[0].count > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Cannot delete vehicle with active bookings. Please wait until all trips are completed.' });
        }
        
        // Delete vehicle (this will cascade delete trips and schedules if configured)
        await connection.execute('DELETE FROM vehicles WHERE id = ?', [id]);
        
        await connection.end();
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get single vehicle details
const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const owner_id = req.user.id;
        
        const connection = await createConnection();
        
        const [vehicles] = await connection.execute(
            'SELECT * FROM vehicles WHERE id = ? AND owner_id = ?',
            [id, owner_id]
        );
        
        await connection.end();
        
        if (vehicles.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        res.json(vehicles[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all available routes (unique route combinations)
const getAllRoutes = async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Get all unique routes with vehicle count, price range, and vehicle types
        const [routes] = await connection.execute(`
            SELECT 
                route_from,
                route_to,
                COUNT(*) as vehicle_count,
                MIN(price) as min_price,
                MAX(price) as max_price,
                GROUP_CONCAT(DISTINCT vehicle_type) as vehicle_types
            FROM vehicles
            WHERE status = 'approved'
            GROUP BY route_from, route_to
            ORDER BY route_from, route_to
        `);
        
        await connection.end();
        res.json(routes);
    } catch (error) {
        console.error('Get all routes error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    registerVehicle, 
    getMyVehicles, 
    createDailySchedule, 
    generateTripsFromSchedule, 
    getMyTrips, 
    searchTrips, 
    searchTripsFlexible, 
    getTripSeats,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    getAllRoutes
};
