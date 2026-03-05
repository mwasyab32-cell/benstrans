const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function createTestClients() {
    try {
        const connection = await createConnection();
        
        const testClients = [
            { name: 'John Doe', email: 'john@example.com', phone: '0712345678', password: 'password123' },
            { name: 'Jane Smith', email: 'jane@example.com', phone: '0723456789', password: 'password123' },
            { name: 'Mike Johnson', email: 'mike@example.com', phone: '0734567890', password: 'password123' }
        ];
        
        for (const client of testClients) {
            // Check if client already exists
            const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [client.email]);
            
            if (existing.length === 0) {
                const hashedPassword = await bcrypt.hash(client.password, 10);
                await connection.execute(
                    'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [client.name, client.email, client.phone, hashedPassword, 'client', 'pending']
                );
                console.log(`Created client: ${client.name} (${client.email})`);
            } else {
                console.log(`Client already exists: ${client.email}`);
            }
        }
        
        await connection.end();
        console.log('Test clients created successfully!');
    } catch (error) {
        console.error('Error creating test clients:', error);
    }
}

createTestClients();