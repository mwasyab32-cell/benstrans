const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createCashier = async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, "cashier")', [username, hashed]);
        res.status(201).json({ message: 'Cashier created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: err.message });
    }
};

const getCashiers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, role, created_at FROM users WHERE role = "cashier"');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const changePassword = async (req, res) => {
    const { userId, newPassword } = req.body;
    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteCashier = async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ? AND role = "cashier"', [req.params.id]);
        res.json({ message: 'Cashier deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { login, createCashier, getCashiers, changePassword, deleteCashier };
