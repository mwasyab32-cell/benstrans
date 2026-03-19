const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createConnection } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const connection = await createConnection();
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, role]
        );
        
        await connection.end();
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
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
        
        if (user.status === 'pending' && user.role !== 'admin') {
            await connection.end();
            return res.status(403).json({ error: 'Account pending approval' });
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