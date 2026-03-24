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

        // Ensure vehicle_schedules table exists (safety net for fresh deployments)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS vehicle_schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                departure_time TIME NOT NULL,
                day_of_week VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                UNIQUE KEY unique_schedule (vehicle_id, departure_time, day_of_week),
                INDEX idx_vehicle_schedule (vehicle_id)
            )
        `);

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
            SELECT route_from, route_to,
                   COUNT(*) as vehicle_count,
                   MIN(price) as min_price,
                   MAX(price) as max_price,
                   GROUP_CONCAT(DISTINCT vehicle_type ORDER BY vehicle_type SEPARATOR ', ') as vehicle_types
            FROM vehicles
            WHERE status = 'approved'
            GROUP BY route_from, route_to
            ORDER BY route_from ASC
        `);

        res.json(routes);

    } catch (error) {
        console.error('ROUTES ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};;

// ================= SEARCH TRIPS =================
const searchTrips = async (req, res) => {
    let connection;
    try {
        const { from, to, date } = req.query;
        if (!from || !to || !date) {
            return res.status(400).json({ error: 'from, to, and date are required' });
        }
        connection = await createConnection();

        let [trips] = await connection.execute(`
            SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.vehicle_type,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
            WHERE v.route_from LIKE ? AND v.route_to LIKE ? AND DATE(t.travel_date) = ? AND v.status = 'approved'
            GROUP BY t.id
            HAVING remaining_seats > 0
        `, [`%${from}%`, `%${to}%`, date]);

        // If no trips found, auto-generate from schedules and retry
        if (trips.length === 0) {
            await autoGenerateTrips(connection, 14);
            [trips] = await connection.execute(`
                SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.vehicle_type,
                       (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
                FROM trips t
                JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
                WHERE v.route_from LIKE ? AND v.route_to LIKE ? AND DATE(t.travel_date) = ? AND v.status = 'approved'
                GROUP BY t.id
                HAVING remaining_seats > 0
            `, [`%${from}%`, `%${to}%`, date]);
        }

        res.json(trips);
    } catch (error) {
        console.error('SEARCH TRIPS ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= SEARCH TRIPS FLEXIBLE =================
const searchTripsFlexible = async (req, res) => {
    let connection;
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'from and to are required' });
        }
        connection = await createConnection();

        let [trips] = await connection.execute(`
            SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.vehicle_type,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
            WHERE v.route_from LIKE ? AND v.route_to LIKE ? AND v.status = 'approved' AND t.travel_date >= CURDATE()
            GROUP BY t.id
            HAVING remaining_seats > 0
            ORDER BY t.travel_date ASC
        `, [`%${from}%`, `%${to}%`]);

        // Auto-generate trips from schedules if none exist
        if (trips.length === 0) {
            await autoGenerateTrips(connection, 14);
            [trips] = await connection.execute(`
                SELECT t.*, v.vehicle_number, v.route_from, v.route_to, v.price, v.vehicle_type,
                       (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
                FROM trips t
                JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
                WHERE v.route_from LIKE ? AND v.route_to LIKE ? AND v.status = 'approved' AND t.travel_date >= CURDATE()
                GROUP BY t.id
                HAVING remaining_seats > 0
                ORDER BY t.travel_date ASC
            `, [`%${from}%`, `%${to}%`]);
        }

        res.json(trips);
    } catch (error) {
        console.error('SEARCH TRIPS FLEXIBLE ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= GET TRIP SEATS =================
const getTripSeats = async (req, res) => {
    let connection;
    try {
        const { trip_id } = req.params;
        connection = await createConnection();
        const [trips] = await connection.execute(`
            SELECT t.*, v.total_seats, v.vehicle_number,
                   (t.available_seats - COALESCE(SUM(b.seats_booked), 0)) as remaining_seats
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN bookings b ON t.id = b.trip_id AND b.payment_status IN ('paid', 'pending')
            WHERE t.id = ?
            GROUP BY t.id
        `, [trip_id]);
        if (trips.length === 0) return res.status(404).json({ error: 'Trip not found' });
        res.json(trips[0]);
    } catch (error) {
        console.error('GET TRIP SEATS ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= GET VEHICLE BY ID =================
const getVehicleById = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const owner_id = req.user.id;
        connection = await createConnection();
        const [vehicles] = await connection.execute(
            'SELECT * FROM vehicles WHERE id = ? AND owner_id = ?',
            [id, owner_id]
        );
        if (vehicles.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicles[0]);
    } catch (error) {
        console.error('GET VEHICLE BY ID ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= UPDATE VEHICLE =================
const updateVehicle = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const owner_id = req.user.id;
        const { vehicle_number, route_from, route_to, total_seats, price, vehicle_type } = req.body;
        connection = await createConnection();
        const [existing] = await connection.execute(
            'SELECT id FROM vehicles WHERE id = ? AND owner_id = ?',
            [id, owner_id]
        );
        if (existing.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        await connection.execute(
            'UPDATE vehicles SET vehicle_number=?, route_from=?, route_to=?, total_seats=?, price=?, vehicle_type=? WHERE id=? AND owner_id=?',
            [vehicle_number, route_from, route_to, total_seats, price, vehicle_type, id, owner_id]
        );
        res.json({ message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error('UPDATE VEHICLE ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= DELETE VEHICLE =================
const deleteVehicle = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const owner_id = req.user.id;
        connection = await createConnection();
        const [existing] = await connection.execute(
            'SELECT id FROM vehicles WHERE id = ? AND owner_id = ?',
            [id, owner_id]
        );
        if (existing.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        await connection.execute('DELETE FROM vehicles WHERE id = ? AND owner_id = ?', [id, owner_id]);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('DELETE VEHICLE ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= GENERATE TRIPS FROM SCHEDULE =================
const generateTripsFromSchedule = async (req, res) => {
    let connection;
    try {
        const { days_ahead = 7 } = req.body;
        connection = await createConnection();

        // Ensure tables exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS vehicle_schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                departure_time TIME NOT NULL,
                day_of_week VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                UNIQUE KEY unique_schedule (vehicle_id, departure_time, day_of_week),
                INDEX idx_vehicle_schedule (vehicle_id)
            )
        `);
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS trips (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                travel_date DATE NOT NULL,
                departure_time TIME NOT NULL,
                available_seats INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                INDEX idx_vehicle_id (vehicle_id),
                INDEX idx_travel_date (travel_date)
            )
        `);

        const [schedules] = await connection.execute(`
            SELECT vs.*, v.total_seats FROM vehicle_schedules vs
            JOIN vehicles v ON vs.vehicle_id = v.id
            WHERE v.status = 'approved'
        `);
        let created = 0;
        const today = new Date();
        for (const schedule of schedules) {
            for (let i = 0; i < days_ahead; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                if (date.getDay() == schedule.day_of_week) {
                    const travelDate = date.toISOString().split('T')[0];
                    const [existing] = await connection.execute(
                        'SELECT id FROM trips WHERE vehicle_id=? AND travel_date=? AND departure_time=?',
                        [schedule.vehicle_id, travelDate, schedule.departure_time]
                    );
                    if (existing.length === 0) {
                        await connection.execute(
                            'INSERT INTO trips (vehicle_id, travel_date, departure_time, available_seats) VALUES (?,?,?,?)',
                            [schedule.vehicle_id, travelDate, schedule.departure_time, schedule.total_seats]
                        );
                        created++;
                    }
                }
            }
        }
        res.json({ message: `Generated ${created} trips` });
    } catch (error) {
        console.error('GENERATE TRIPS ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// ================= HELPER: AUTO-GENERATE TRIPS FROM SCHEDULES =================
async function autoGenerateTrips(connection, daysAhead = 14) {
    try {
        const [schedules] = await connection.execute(`
            SELECT vs.*, v.total_seats FROM vehicle_schedules vs
            JOIN vehicles v ON vs.vehicle_id = v.id
            WHERE v.status = 'approved'
        `);
        const today = new Date();
        for (const schedule of schedules) {
            for (let i = 0; i < daysAhead; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                if (date.getDay() == schedule.day_of_week) {
                    const travelDate = date.toISOString().split('T')[0];
                    const [existing] = await connection.execute(
                        'SELECT id FROM trips WHERE vehicle_id=? AND travel_date=? AND departure_time=?',
                        [schedule.vehicle_id, travelDate, schedule.departure_time]
                    );
                    if (existing.length === 0) {
                        await connection.execute(
                            'INSERT INTO trips (vehicle_id, travel_date, departure_time, available_seats) VALUES (?,?,?,?)',
                            [schedule.vehicle_id, travelDate, schedule.departure_time, schedule.total_seats]
                        );
                    }
                }
            }
        }
    } catch (err) {
        console.error('Auto-generate trips error:', err.message);
    }
}

module.exports = {
    registerVehicle,
    getMyVehicles,
    createDailySchedule,
    getMyTrips,
    getAllRoutes,
    searchTrips,
    searchTripsFlexible,
    getTripSeats,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    generateTripsFromSchedule
};