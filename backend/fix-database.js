const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixDatabase() {
    try {
        const connection = await createConnection();
        
        // 1. Check if database and tables exist
        console.log('Checking database structure...');
        
        // Check users table
        try {
            const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
            console.log(`Users table exists with ${users[0].count} records`);
        } catch (error) {
            console.log('Users table missing, creating...');
            await connection.execute(`
                CREATE TABLE users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100),
                    email VARCHAR(100) UNIQUE,
                    phone VARCHAR(20),
                    password VARCHAR(255),
                    role ENUM('admin', 'owner', 'client'),
                    status ENUM('pending', 'approved') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        
        // Check vehicles table
        try {
            const [vehicles] = await connection.execute('SELECT COUNT(*) as count FROM vehicles');
            console.log(`Vehicles table exists with ${vehicles[0].count} records`);
        } catch (error) {
            console.log('Vehicles table missing, creating...');
            await connection.execute(`
                CREATE TABLE vehicles (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    owner_id INT,
                    vehicle_number VARCHAR(50),
                    route_from VARCHAR(100),
                    route_to VARCHAR(100),
                    total_seats INT,
                    price DECIMAL(10,2),
                    status ENUM('pending', 'approved') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES users(id)
                )
            `);
        }
        
        // Check contacts table
        try {
            const [contacts] = await connection.execute('SELECT COUNT(*) as count FROM contacts');
            console.log(`Contacts table exists with ${contacts[0].count} records`);
        } catch (error) {
            console.log('Contacts table missing, creating...');
            await connection.execute(`
                CREATE TABLE contacts (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    subject VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    status ENUM('new', 'read', 'responded') DEFAULT 'new',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        
        // Check trips table
        try {
            const [trips] = await connection.execute('SELECT COUNT(*) as count FROM trips');
            console.log(`Trips table exists with ${trips[0].count} records`);
        } catch (error) {
            console.log('Trips table missing, creating...');
            await connection.execute(`
                CREATE TABLE trips (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    vehicle_id INT,
                    travel_date DATE,
                    departure_time TIME,
                    available_seats INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
                )
            `);
        }
        
        // Check bookings table
        try {
            const [bookings] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
            console.log(`Bookings table exists with ${bookings[0].count} records`);
        } catch (error) {
            console.log('Bookings table missing, creating...');
            await connection.execute(`
                CREATE TABLE bookings (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    client_id INT,
                    trip_id INT,
                    seats_booked INT,
                    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (client_id) REFERENCES users(id),
                    FOREIGN KEY (trip_id) REFERENCES trips(id)
                )
            `);
        }
        
        // 2. Ensure admin user exists
        const [admins] = await connection.execute('SELECT * FROM users WHERE role = "admin"');
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin', 'admin@benstrans.com', '0700000000', hashedPassword, 'admin', 'approved']
            );
            console.log('Admin user created');
        }
        
        // 3. Add test data if missing
        const [allUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        if (allUsers[0].count < 3) {
            // Add test clients
            const testClients = [
                { name: 'John Doe', email: 'john@example.com', phone: '0712345678' },
                { name: 'Jane Smith', email: 'jane@example.com', phone: '0723456789' },
                { name: 'Mike Johnson', email: 'mike@example.com', phone: '0734567890' }
            ];
            
            for (const client of testClients) {
                const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [client.email]);
                if (existing.length === 0) {
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    await connection.execute(
                        'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [client.name, client.email, client.phone, hashedPassword, 'client', 'pending']
                    );
                    console.log(`Added test client: ${client.name}`);
                }
            }
            
            // Add test owner if not exists
            const [owners] = await connection.execute('SELECT * FROM users WHERE role = "owner"');
            if (owners.length === 0) {
                const hashedPassword = await bcrypt.hash('owner123', 10);
                await connection.execute(
                    'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                    ['Test Owner', 'owner@example.com', '0701234567', hashedPassword, 'owner', 'approved']
                );
                console.log('Added test owner');
            }
        }
        
        // 4. Add test contacts if missing
        const [contactCount] = await connection.execute('SELECT COUNT(*) as count FROM contacts');
        if (contactCount[0].count === 0) {
            const testContacts = [
                { name: 'Alice Brown', email: 'alice@example.com', phone: '0745678901', subject: 'Booking Inquiry', message: 'I need help with booking a trip to Mombasa.' },
                { name: 'Bob Wilson', email: 'bob@example.com', phone: '0756789012', subject: 'Payment Issue', message: 'I had trouble with payment processing.' }
            ];
            
            for (const contact of testContacts) {
                await connection.execute(
                    'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
                    [contact.name, contact.email, contact.phone, contact.subject, contact.message]
                );
                console.log(`Added test contact: ${contact.name}`);
            }
        }
        
        // 5. Show final status
        console.log('\n=== FINAL DATABASE STATUS ===');
        const [finalUsers] = await connection.execute('SELECT role, status, COUNT(*) as count FROM users GROUP BY role, status');
        finalUsers.forEach(row => {
            console.log(`${row.role} (${row.status}): ${row.count}`);
        });
        
        const [finalVehicles] = await connection.execute('SELECT COUNT(*) as count FROM vehicles');
        console.log(`Vehicles: ${finalVehicles[0].count}`);
        
        const [finalContacts] = await connection.execute('SELECT COUNT(*) as count FROM contacts');
        console.log(`Contacts: ${finalContacts[0].count}`);
        
        await connection.end();
        console.log('\nDatabase setup complete!');
        
    } catch (error) {
        console.error('Database setup error:', error);
    }
}

fixDatabase();