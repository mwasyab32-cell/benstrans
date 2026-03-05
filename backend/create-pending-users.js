const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function createPendingUsers() {
    try {
        const connection = await createConnection();
        
        // Create pending clients
        const pendingClients = [
            { name: 'Sarah Johnson', email: 'sarah@test.com', phone: '0712000001' },
            { name: 'David Brown', email: 'david@test.com', phone: '0712000002' }
        ];
        
        for (const client of pendingClients) {
            const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [client.email]);
            if (existing.length === 0) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                await connection.execute(
                    'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [client.name, client.email, client.phone, hashedPassword, 'client', 'pending']
                );
                console.log(`Created pending client: ${client.name}`);
            }
        }
        
        // Create pending owner
        const [ownerExists] = await connection.execute('SELECT id FROM users WHERE email = ? AND status = "pending"', ['pending.owner@test.com']);
        if (ownerExists.length === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Pending Owner', 'pending.owner@test.com', '0712000003', hashedPassword, 'owner', 'pending']
            );
            console.log('Created pending owner');
        }
        
        await connection.end();
        console.log('Pending users created successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createPendingUsers();