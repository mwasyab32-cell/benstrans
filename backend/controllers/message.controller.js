const { createConnection } = require('../config/db');

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { receiver_id, subject, message } = req.body;
        const sender_id = req.user.id;
        
        if (!receiver_id || !message) {
            return res.status(400).json({ error: 'Receiver and message are required' });
        }
        
        const connection = await createConnection();
        
        // Verify receiver exists
        const [receiver] = await connection.execute(
            'SELECT id, role FROM users WHERE id = ?',
            [receiver_id]
        );
        
        if (receiver.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Receiver not found' });
        }
        
        // Insert message
        const [result] = await connection.execute(
            'INSERT INTO messages (sender_id, receiver_id, subject, message) VALUES (?, ?, ?, ?)',
            [sender_id, receiver_id, subject || 'No Subject', message]
        );
        
        // Update or create conversation
        if (req.user.role === 'owner' && receiver[0].role === 'admin') {
            await connection.execute(
                `INSERT INTO conversations (owner_id, admin_id, last_message_at) 
                 VALUES (?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE last_message_at = NOW()`,
                [sender_id, receiver_id]
            );
        } else if (req.user.role === 'admin' && receiver[0].role === 'owner') {
            await connection.execute(
                `INSERT INTO conversations (owner_id, admin_id, last_message_at) 
                 VALUES (?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE last_message_at = NOW()`,
                [receiver_id, sender_id]
            );
        }
        
        await connection.end();
        
        res.status(201).json({ 
            success: true,
            message: 'Message sent successfully',
            messageId: result.insertId 
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get messages between two users
const getMessages = async (req, res) => {
    try {
        const { user_id } = req.params;
        const current_user_id = req.user.id;
        
        const connection = await createConnection();
        
        // Get all messages between the two users
        const [messages] = await connection.execute(`
            SELECT m.*, 
                   sender.name as sender_name, 
                   sender.role as sender_role,
                   receiver.name as receiver_name,
                   receiver.role as receiver_role
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `, [current_user_id, user_id, user_id, current_user_id]);
        
        // Mark messages as read
        await connection.execute(
            'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
            [current_user_id, user_id]
        );
        
        await connection.end();
        
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

// Get all conversations for a user
const getConversations = async (req, res) => {
    try {
        const user_id = req.user.id;
        const user_role = req.user.role;
        
        // Only owners and admins can have conversations
        if (user_role !== 'owner' && user_role !== 'admin') {
            return res.json([]);
        }
        
        const connection = await createConnection();
        
        let conversations = [];
        
        if (user_role === 'owner') {
            // Get conversations with admins
            [conversations] = await connection.execute(`
                SELECT 
                    c.id as conversation_id,
                    c.last_message_at,
                    admin.id as other_user_id,
                    admin.name as other_user_name,
                    admin.role as other_user_role,
                    (SELECT COUNT(*) FROM messages 
                     WHERE receiver_id = ? AND sender_id = admin.id AND is_read = FALSE) as unread_count,
                    (SELECT message FROM messages 
                     WHERE (sender_id = ? AND receiver_id = admin.id) 
                        OR (sender_id = admin.id AND receiver_id = ?)
                     ORDER BY created_at DESC LIMIT 1) as last_message
                FROM conversations c
                JOIN users admin ON c.admin_id = admin.id
                WHERE c.owner_id = ?
                ORDER BY c.last_message_at DESC
            `, [user_id, user_id, user_id, user_id]);
        } else if (user_role === 'admin') {
            // Get conversations with owners
            [conversations] = await connection.execute(`
                SELECT 
                    c.id as conversation_id,
                    c.last_message_at,
                    owner.id as other_user_id,
                    owner.name as other_user_name,
                    owner.role as other_user_role,
                    (SELECT COUNT(*) FROM messages 
                     WHERE receiver_id = ? AND sender_id = owner.id AND is_read = FALSE) as unread_count,
                    (SELECT message FROM messages 
                     WHERE (sender_id = ? AND receiver_id = owner.id) 
                        OR (sender_id = owner.id AND receiver_id = ?)
                     ORDER BY created_at DESC LIMIT 1) as last_message
                FROM conversations c
                JOIN users owner ON c.owner_id = owner.id
                WHERE c.admin_id = ?
                ORDER BY c.last_message_at DESC
            `, [user_id, user_id, user_id, user_id]);
        }
        
        await connection.end();
        
        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        console.error('Error details:', error.message);
        console.error('User ID:', req.user?.id);
        console.error('User Role:', req.user?.role);
        res.status(500).json({ error: 'Failed to get conversations', details: error.message });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const connection = await createConnection();
        
        const [result] = await connection.execute(
            'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [user_id]
        );
        
        await connection.end();
        
        res.json({ unread_count: result[0].unread_count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Get all admins (for owners to select who to message)
const getAdmins = async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [admins] = await connection.execute(
            'SELECT id, name, email FROM users WHERE role = "admin" AND status = "approved"'
        );
        
        await connection.end();
        
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Failed to get admins' });
    }
};

// Mark message as read
const markAsRead = async (req, res) => {
    try {
        const { message_id } = req.params;
        const user_id = req.user.id;
        
        const connection = await createConnection();
        
        await connection.execute(
            'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
            [message_id, user_id]
        );
        
        await connection.end();
        
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    try {
        const { message_id } = req.params;
        const user_id = req.user.id;
        
        const connection = await createConnection();
        
        // Only allow deletion if user is sender
        await connection.execute(
            'DELETE FROM messages WHERE id = ? AND sender_id = ?',
            [message_id, user_id]
        );
        
        await connection.end();
        
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    getConversations,
    getUnreadCount,
    getAdmins,
    markAsRead,
    deleteMessage
};