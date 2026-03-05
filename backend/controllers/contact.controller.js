const { createConnection } = require('../config/db');

const submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        const connection = await createConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, subject, message]
        );
        
        const contactId = result.insertId;
        
        // Send automatic welcome reply
        const welcomeMessage = `Dear ${name},\n\nThank you for contacting BENSTRANS TRAVEL COMPANY! 🚌\n\nWe have received your message regarding "${subject}" and we truly appreciate you reaching out to us.\n\nOur dedicated support team will review your inquiry and get back to you as soon as possible. We are committed to providing you with the best travel experience and excellent customer service.\n\nIn the meantime, feel free to:\n• Browse our available routes\n• Book your next trip online\n• Check our services and offers\n\nThank you for choosing BENSTRANS for your travel needs. We look forward to serving you!\n\nBest regards,\nBENSTRANS Support Team\n📞 +254 748 648 015\n✉️ info@benstrans.com`;
        
        await connection.execute(
            'UPDATE contacts SET admin_reply = ?, replied_at = NOW(), status = ? WHERE id = ?',
            [welcomeMessage, 'responded', contactId]
        );
        
        await connection.end();
        res.status(201).json({ 
            message: 'Contact form submitted successfully', 
            contactId: contactId,
            auto_reply: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getContacts = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [contacts] = await connection.execute(
            'SELECT * FROM contacts ORDER BY created_at DESC'
        );
        
        await connection.end();
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        
        const [contacts] = await connection.execute(
            'SELECT * FROM contacts WHERE id = ?',
            [id]
        );
        
        await connection.end();
        
        if (contacts.length === 0) {
            return res.status(404).json({ error: 'Contact message not found' });
        }
        
        res.json(contacts[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const replyToContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const adminId = req.user.id;
        
        if (!reply || reply.trim() === '') {
            return res.status(400).json({ error: 'Reply message is required' });
        }
        
        const connection = await createConnection();
        
        // Check if contact exists
        const [contacts] = await connection.execute(
            'SELECT * FROM contacts WHERE id = ?',
            [id]
        );
        
        if (contacts.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Contact message not found' });
        }
        
        // Update with reply
        await connection.execute(
            'UPDATE contacts SET admin_reply = ?, replied_at = NOW(), replied_by = ?, status = ? WHERE id = ?',
            [reply, adminId, 'responded', id]
        );
        
        await connection.end();
        
        res.json({ 
            message: 'Reply sent successfully',
            contactId: id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['new', 'read', 'responded'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const connection = await createConnection();
        
        await connection.execute(
            'UPDATE contacts SET status = ? WHERE id = ?',
            [status, id]
        );
        
        await connection.end();
        
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get messages by email (for guests without accounts)
const getMessagesByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const connection = await createConnection();
        
        const [contacts] = await connection.execute(
            'SELECT id, name, email, subject, message, admin_reply, status, created_at, replied_at FROM contacts WHERE email = ? ORDER BY created_at DESC',
            [email]
        );
        
        await connection.end();
        
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { submitContact, getContacts, getContactById, replyToContact, updateContactStatus, getMessagesByEmail };