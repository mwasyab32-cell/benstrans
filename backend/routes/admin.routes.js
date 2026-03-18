const express = require('express');
const { getPendingClients, getPendingOwners, approveUser, getPendingVehicles, approveVehicle, rejectVehicle, getAllUsers, getAllVehicles, getUserStats, getVehicleStats, getNewVehicles, getBookingStats, getContactStats, getAllBookings } = require('../controllers/admin.controller.new');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/pending-clients', authenticateToken, checkRole(['admin']), getPendingClients);
router.get('/pending-owners', authenticateToken, checkRole(['admin']), getPendingOwners);
router.put('/approve-user/:id', authenticateToken, checkRole(['admin']), approveUser);
router.get('/pending-vehicles', authenticateToken, checkRole(['admin']), getPendingVehicles);
router.put('/approve-vehicle/:id', authenticateToken, checkRole(['admin']), approveVehicle);
router.put('/reject-vehicle/:id', authenticateToken, checkRole(['admin']), rejectVehicle);
router.get('/all-users', authenticateToken, checkRole(['admin']), getAllUsers);
router.get('/all-vehicles', authenticateToken, checkRole(['admin']), getAllVehicles);
router.get('/bookings', authenticateToken, checkRole(['admin']), getAllBookings);
router.get('/stats/users', authenticateToken, checkRole(['admin']), getUserStats);
router.get('/stats/vehicles', authenticateToken, checkRole(['admin']), getVehicleStats);
router.get('/new-vehicles', authenticateToken, checkRole(['admin']), getNewVehicles);
router.get('/stats/bookings', authenticateToken, checkRole(['admin']), getBookingStats);
router.get('/stats/contacts', authenticateToken, checkRole(['admin']), getContactStats);

module.exports = router;