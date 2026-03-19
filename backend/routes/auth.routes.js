const express = require('express');
const bcrypt = require('bcryptjs');
const { register, login } = require('../controllers/auth.controller');
const { createConnection } = require('../config/db');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Temporary debug + fix endpoint - remove after login works
router.get('/debug-fix-admin', async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Show all users
        const [users] = await connection.execute(
            'SELECT id, name, email, role, status, password FROM users'
        );
        
        const userInfo = users.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            status: u.status,
            password_is_hashed: u.password ? u.password.startsWith('$2b$') : false,
            password_preview: u.password ? u.password.substring(0, 15) : 'NULL'
        }));

        // Force recreate admin with fresh hash
        await connection.execute('DELETE FROM users WHERE email = ?', ['admin@benstrans.com']);
        const newHash = await bcrypt.hash('admin123', 10);
        await connection.execute(
            'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['Admin', 'admin@benstrans.com', '0700000000', newHash, 'admin', 'approved']
        );

        // Verify
        const [admin] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@benstrans.com']);
        const passwordWorks = await bcrypt.compare('admin123', admin[0].password);

        await connection.end();

        res.json({
            existing_users_before_fix: userInfo,
            fix_applied: true,
            password_test: passwordWorks ? 'PASS - login will work' : 'FAIL - something is wrong',
            login_with: { email: 'admin@benstrans.com', password: 'admin123' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;