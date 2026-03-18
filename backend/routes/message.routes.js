const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
    sendMessage,
    getMessages,
    getConversations,
    getUnreadCount,
    getAdmins,
    markAsRead,
    deleteMessage
} = require('../controllers/message.controller');

// All routes require authentication
router.use(authenticateToken);

// Send a message
router.post('/send', sendMessage);

// Get messages between current user and another user
router.get('/conversation/:user_id', getMessages);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get all admins (for owners to select recipient)
router.get('/admins', getAdmins);

// Mark message as read
router.put('/read/:message_id', markAsRead);

// Delete a message
router.delete('/:message_id', deleteMessage);

module.exports = router;