const express = require('express');
const { handleDeliveryReport, getSMSStats, getSMSLogsByPhone } = require('../controllers/sms.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

// Public endpoint for Africa's Talking delivery reports
router.post('/delivery-report', handleDeliveryReport);

// Admin endpoints for viewing SMS statistics
router.get('/stats', authenticateToken, checkRole(['admin']), getSMSStats);
router.get('/logs/:phoneNumber', authenticateToken, checkRole(['admin']), getSMSLogsByPhone);

module.exports = router;
