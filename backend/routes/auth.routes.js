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

// Fix any user's password - GET /api/auth/fix-password?email=xxx@xxx.com&newpass=newpassword
router.get('/fix-password', async (req, res) => {
    try {
        const { email, newpass } = req.query;
        if (!email || !newpass) {
            return res.status(400).json({ error: 'email and newpass query params required' });
        }

        const connection = await createConnection();

        const [users] = await connection.execute('SELECT id, email, role, status FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'User not found', all_emails: (await connection.execute('SELECT email, role, status FROM users'))[0] });
        }

        const newHash = await bcrypt.hash(newpass, 10);
        await connection.execute(
            "UPDATE users SET password = ?, status = 'approved' WHERE email = ?",
            [newHash, email]
        );

        // Verify
        const [updated] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        const works = await bcrypt.compare(newpass, updated[0].password);

        await connection.end();
        res.json({
            success: true,
            user: { id: updated[0].id, email: updated[0].email, role: updated[0].role, status: updated[0].status },
            password_test: works ? 'PASS - can login now' : 'FAIL',
            login_with: { email, password: newpass }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;