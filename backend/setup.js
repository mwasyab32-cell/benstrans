const { createConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
    try {
        const connection = await createConnection();
        
        // Check if admin exists
        const [admins] = await connection.execute('SELECT * FROM users WHERE role = "admin"');
        
        if (admins.length === 0) {
            // Create admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin', 'admin@benstrans.com', '0700000000', hashedPassword, 'admin', 'approved']
            );
            console.log('Admin created: admin@benstrans.com / admin123');
        } else {
            console.log('Admin exists:', admins[0].email);
        }
        
        // Check pending owners
        const [owners] = await connection.execute('SELECT * FROM users WHERE role = "owner"');
        console.log('Owners in system:', owners.length);
        
        await connection.end();
    } catch (error) {
        console.error('Setup error:', error);
    }
}

setupAdmin();