const express = require('express');
const { submitContact, getContacts, getContactById, replyToContact, updateContactStatus, getMessagesByEmail } = require('../controllers/contact.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', submitContact);
router.get('/', authenticateToken, checkRole(['admin']), getContacts);
router.get('/email/:email', getMessagesByEmail); // Public endpoint for guests
router.get('/:id', authenticateToken, checkRole(['admin']), getContactById);
router.post('/:id/reply', authenticateToken, checkRole(['admin']), replyToContact);
router.patch('/:id/status', authenticateToken, checkRole(['admin']), updateContactStatus);

module.exports = router;