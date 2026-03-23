const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createConnection } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const connection = await createConnection();
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Auto-approve all users on registration
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, role, 'approved']
        );
        
        await connection.end();
        res.status(201).json({ message: 'Registration successful! You can now login.', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt:', email);
        console.log('🔐 Password received:', password ? 'YES (length: ' + password.length + ')' : 'NO');

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const connection = await createConnection();
        
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        console.log('🔐 Users found:', users.length);

        if (users.length === 0) {
            await connection.end();
            console.log('🔐 FAIL: User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        console.log('🔐 User role:', user.role, '| status:', user.status);
        console.log('🔐 Password hash starts with:', user.password ? user.password.substring(0, 7) : 'NULL');

        const validPassword = await bcrypt.compare(password, user.password);
        console.log('🔐 Password match:', validPassword);
        
        if (!validPassword) {
            await connection.end();
            console.log('🔐 FAIL: Password mismatch');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (user.status === 'pending') {
            // Auto-approve on login if still pending
            await connection.execute("UPDATE users SET status = 'approved' WHERE id = ?", [user.id]);
            user.status = 'approved';
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        await connection.end();
        console.log('🔐 SUCCESS: Login for', email);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('🔐 Login error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login };