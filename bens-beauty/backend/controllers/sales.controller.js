const db = require('../config/db');

const checkout = async (req, res) => {
    const { items, payment_method } = req.body;
    const cashier_id = req.user.id;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Check stock and calculate total
        let total = 0;
        for (const item of items) {
            const [rows] = await conn.execute('SELECT * FROM products WHERE id = ?', [item.id]);
            if (rows.length === 0) throw new Error(`Product not found: ${item.name}`);
            if (rows[0].quantity < item.qty) throw new Error(`Insufficient stock for ${rows[0].name}`);
            total += rows[0].price * item.qty;
        }

        // Create sale
        const [saleResult] = await conn.execute(
            'INSERT INTO sales (cashier_id, total, payment_method) VALUES (?, ?, ?)',
            [cashier_id, total, payment_method || 'cash']
        );
        const saleId = saleResult.insertId;

        // Insert sale items and deduct stock
        for (const item of items) {
            const [rows] = await conn.execute('SELECT * FROM products WHERE id = ?', [item.id]);
            const product = rows[0];
            await conn.execute(
                'INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity, subtotal) VALUES (?,?,?,?,?,?)',
                [saleId, item.id, product.name, product.price, item.qty, product.price * item.qty]
            );
            await conn.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.qty, item.id]);
        }

        await conn.commit();
        res.status(201).json({ message: 'Sale completed', saleId, total });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        conn.release();
    }
};

const getHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const [sales] = await db.execute(`
            SELECT s.*, u.username as cashier_name,
                   GROUP_CONCAT(si.product_name, ' x', si.quantity SEPARATOR ', ') as items_summary
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ?
        `, [limit]);
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getSaleDetail = async (req, res) => {
    try {
        const [items] = await db.execute(
            'SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]
        );
        const [sale] = await db.execute(
            'SELECT s.*, u.username as cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.id WHERE s.id = ?',
            [req.params.id]
        );
        res.json({ sale: sale[0], items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getDailySummary = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(total) as total_revenue,
                DATE(created_at) as date
            FROM sales
            WHERE DATE(created_at) = CURDATE()
            GROUP BY DATE(created_at)
        `);
        res.json(rows[0] || { total_transactions: 0, total_revenue: 0, date: new Date().toISOString().split('T')[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { checkout, getHistory, getSaleDetail, getDailySummary };
