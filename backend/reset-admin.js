// Reset admin password - run this in Render Shell:
// node backend/reset-admin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createConnection } = require('./config/db');

async function resetAdmin() {
    try {
        const connection = await createConnection();
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Check if admin exists
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?', ['admin@benstrans.com']
        );
        
        if (existing.length > 0) {
            // Update existing admin password
            await connection.execute(
                'UPDATE users SET password = ?, status = ?, role = ? WHERE email = ?',
                [hashedPassword, 'approved', 'admin', 'admin@benstrans.com']
            );
            console.log('✅ Admin password reset successfully!');
        } else {
            // Create new admin
            await connection.execute(
                'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin', 'admin@benstrans.com', '0700000000', hashedPassword, 'admin', 'approved']
            );
            console.log('✅ Admin user created successfully!');
        }
        
        console.log('📧 Email: admin@benstrans.com');
        console.log('🔑 Password: admin123');
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdmin();
