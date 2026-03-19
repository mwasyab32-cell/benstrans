const { createConnection } = require('../config/db');

const getPendingOwners = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [users] = await connection.execute(
            'SELECT id, name, email, phone, role, created_at FROM users WHERE role = "owner" AND status = "pending"'
        );
        
        await connection.end();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        
        await connection.execute(
            'UPDATE users SET status = "approved" WHERE id = ?',
            [id]
        );
        
        await connection.end();
        res.json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPendingVehicles = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [vehicles] = await connection.execute(`
            SELECT v.*, u.name as owner_name, u.email as owner_email,
                   DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i') as registration_date
            FROM vehicles v
            JOIN users u ON v.owner_id = u.id
            WHERE v.status = 'pending'
            ORDER BY v.created_at DESC
        `);
        
        await connection.end();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const approveVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        
        await connection.execute(
            'UPDATE vehicles SET status = "approved" WHERE id = ?',
            [id]
        );
        
        await connection.end();
        res.json({ message: 'Vehicle approved successfully and is now visible to clients' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const rejectVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        
        await connection.execute(
            'UPDATE vehicles SET status = "rejected" WHERE id = ?',
            [id]
        );
        
        await connection.end();
        res.json({ message: 'Vehicle rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getVehicleStats = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_vehicles,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_vehicles,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_vehicles,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM vehicles
        `);
        
        await connection.end();
        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNewVehicles = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [vehicles] = await connection.execute(`
            SELECT v.*, u.name as owner_name, u.email as owner_email,
                   DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i') as registration_date
            FROM vehicles v
            JOIN users u ON v.owner_id = u.id
            WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY v.created_at DESC
        `);
        
        await connection.end();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [bookings] = await connection.execute(`
            SELECT b.*, 
                   v.vehicle_number, v.route_from, v.route_to,
                   t.travel_date, t.departure_time
            FROM booking b
            JOIN trips t ON b.trip_id = t.id
            JOIN vehicles v ON t.vehicle_id = v.id
            ORDER BY b.booking_date DESC
        `);
        
        await connection.end();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getPendingOwners, approveUser, getPendingVehicles, approveVehicle, rejectVehicle, getVehicleStats, getNewVehicles, getAllBookings };