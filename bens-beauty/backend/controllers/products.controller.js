const db = require('../config/db');

const getAll = async (req, res) => {
    try {
        const { category, search } = req.query;
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
        if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
        sql += ' ORDER BY name ASC';
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const create = async (req, res) => {
    const { name, price, quantity, variant, category } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO products (name, price, quantity, variant, category) VALUES (?, ?, ?, ?, ?)',
            [name, price, quantity || 0, variant || '', category || 'general']
        );
        res.status(201).json({ id: result.insertId, message: 'Product created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const update = async (req, res) => {
    const { name, price, quantity, variant, category } = req.body;
    try {
        await db.execute(
            'UPDATE products SET name=?, price=?, quantity=?, variant=?, category=? WHERE id=?',
            [name, price, quantity, variant || '', category || 'general', req.params.id]
        );
        res.json({ message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const remove = async (req, res) => {
    try {
        await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAll, create, update, remove };
