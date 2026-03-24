const { createConnection } = require('../config/db');

// ================= REGISTER VEHICLE =================
const registerVehicle = async (req, res) => {
    let connection;
    try {
        console.log('Vehicle registration request:', req.body);
        console.log('User:', req.user);

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { vehicle_number, route_from, route_to, total_seats, price, vehicle_type } = req.body;
        const owner_id = req.user.id;

        if (!vehicle_number || !route_from || !route_to || !total_seats || !price || !vehicle_type) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        connection = await createConnection();

        // Check owner
        const [ownerCheck] = await connection.execute(
            "SELECT status FROM users WHERE id = ? AND role = 'owner'",
            [owner_id]
        );

        if (ownerCheck.length === 0) {
            return res.status(403).json({ error: 'Owner account not found' });
        }

        if (ownerCheck[0].status !== 'approved') {
            return res.status(403).json({ error: 'Owner must be approved' });
        }

        const registrationCharges = {
            bus: 5000,
            shuttle: 3000
        };

        const registrationFee = registrationCharges[vehicle_type.toLowerCase()];
        if (!registrationFee) {
            return res.status(400).json({ error: 'Invalid vehicle type' });
        }

        const [existing] = await connection.execute(
            'SELECT id FROM vehicles WHERE vehicle_number = ?',
            [vehicle_number]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Vehicle already exists' });
        }

        const [result] = await connection.execute(
            `INSERT INTO vehicles 
            (owner_id, vehicle_number, route_from, route_to, total_seats, price, vehicle_type, registration_fee, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
            [owner_id, vehicle_number, route_from, route_to, total_seats, price, vehicle_type, registrationFee]
        );

        res.status(201).json({
            message: `Vehicle registered successfully. Fee: KSh ${registrationFee}`,
            vehicleId: result.insertId
        });

    } catch (error) {
        console.error('REGISTER VEHICLE ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= GET MY VEHICLES (FIXED) =================
const getMyVehicles = async (req, res) => {
    let connection;
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const owner_id = req.user.id;
        connection = await createConnection();

        const [vehicles] = await connection.execute(
            'SELECT * FROM vehicles WHERE owner_id = ?',
            [owner_id]
        );

        res.json(vehicles);

    } catch (error) {
        console.error('GET MY VEHICLES ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= CREATE SCHEDULE =================
const createDailySchedule = async (req, res) => {
    let connection;
    try {
        const { vehicle_id, departure_times, days_of_week } = req.body;
        const owner_id = req.user.id;

        connection = await createConnection();

        const [vehicle] = await connection.execute(
            'SELECT id, status FROM vehicles WHERE id = ? AND owner_id = ?',
            [vehicle_id, owner_id]
        );

        if (vehicle.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (vehicle[0].status !== 'approved') {
            return res.status(400).json({ error: 'Vehicle not approved' });
        }

        for (const time of departure_times) {
            for (const day of days_of_week) {
                await connection.execute(
                    `INSERT INTO vehicle_schedules (vehicle_id, departure_time, day_of_week) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE departure_time = VALUES(departure_time)`,
                    [vehicle_id, time, day]
                );
            }
        }

        res.status(201).json({ message: 'Schedule created' });

    } catch (error) {
        console.error('SCHEDULE ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= GET MY TRIPS =================
const getMyTrips = async (req, res) => {
    let connection;
    try {
        const owner_id = req.user.id;
        connection = await createConnection();

        const [trips] = await connection.execute(`
            SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id
            WHERE v.owner_id = ?
            GROUP BY t.id
        `, [owner_id]);

        res.json(trips);

    } catch (error) {
        console.error('GET TRIPS ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= GET ROUTES =================
const getAllRoutes = async (req, res) => {
    let connection;
    try {
        connection = await createConnection();

        const [routes] = await connection.execute(`
            SELECT route_from, route_to, COUNT(*) as vehicle_count
            FROM vehicles
            WHERE status = 'approved'
            GROUP BY route_from, route_to
        `);

        res.json(routes);

    } catch (error) {
        console.error('ROUTES ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

module.exports = {
    registerVehicle,
    getMyVehicles,
    createDailySchedule,
    getMyTrips,
    getAllRoutes
};