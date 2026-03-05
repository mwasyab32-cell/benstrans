const bcrypt = require('bcryptjs');
const { createConnection } = require('./config/db');

async function createAdminUser() {
    try {
        const connection = await createConnection();
        
        // Hash the password 'admin123'
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Delete existing admin if exists
        await connection.execute('DELETE FROM users WHERE email = ?', ['admin@benstrans.com']);
        
        // Insert new admin user
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['Admin', 'admin@benstrans.com', '0700000000', hashedPassword, 'admin', 'approved']
        );
        
        console.log('Admin user created successfully!');
        console.log('Email: admin@benstrans.com');
        console.log('Password: admin123');
        
        await connection.end();
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

createAdminUser();