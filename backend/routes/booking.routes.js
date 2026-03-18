const express = require('express');
const { createBooking, getMyBookings, createGuestBooking, getReceipt } = require('../controllers/booking.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

// Guest booking (no authentication required)
router.post('/guest', createGuestBooking);

// Get receipt by reference number (no authentication required)
router.get('/receipt/:reference_number', getReceipt);

// Authenticated bookings
router.post('/', authenticateToken, checkRole(['client']), createBooking);
router.get('/my-bookings', authenticateToken, checkRole(['client']), getMyBookings);

module.exports = router;