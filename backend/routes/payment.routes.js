const express = require('express');
const { 
    initiatePayment, 
    checkPaymentStatus, 
    mpesaCallback, 
    getPaymentHistory, 
    cancelBooking 
} = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

// Client payment routes (require authentication)
router.post('/initiate', authenticateToken, checkRole(['client']), initiatePayment);
router.get('/status/:booking_id', authenticateToken, checkRole(['client']), checkPaymentStatus);
router.get('/history', authenticateToken, checkRole(['client']), getPaymentHistory);
router.delete('/cancel/:booking_id', authenticateToken, checkRole(['client']), cancelBooking);

// M-Pesa callback (no authentication required)
router.post('/mpesa-callback', mpesaCallback);

module.exports = router;