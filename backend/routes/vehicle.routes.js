const express = require('express');
const {
    registerVehicle,
    getMyVehicles,
    createDailySchedule,
    generateTripsFromSchedule,
    getMyTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    searchTrips,
    searchTripsFlexible,
    getTripSeats,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    getAllRoutes
} = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.get('/routes', getAllRoutes);
router.get('/trips/search', searchTrips);
router.get('/trips/search-flexible', searchTripsFlexible);

// Owner routes
router.post('/register', authenticateToken, checkRole(['owner']), registerVehicle);
router.get('/my-vehicles', authenticateToken, checkRole(['owner']), getMyVehicles);
router.get('/my-trips', authenticateToken, checkRole(['owner']), getMyTrips);
router.post('/trips', authenticateToken, checkRole(['owner']), createTrip);
router.put('/trips/:id', authenticateToken, checkRole(['owner']), updateTrip);
router.delete('/trips/:id', authenticateToken, checkRole(['owner']), deleteTrip);
router.post('/schedule', authenticateToken, checkRole(['owner']), createDailySchedule);

// Admin routes
router.post('/generate-trips', authenticateToken, checkRole(['admin']), generateTripsFromSchedule);

// Trip details (public optional if needed, or authenticated)
router.get('/trips/:trip_id/seats', getTripSeats);

// ID-based vehicle routes (must be last to avoid conflicts)
router.get('/:id', authenticateToken, checkRole(['owner']), getVehicleById);
router.put('/:id', authenticateToken, checkRole(['owner']), updateVehicle);
router.delete('/:id', authenticateToken, checkRole(['owner']), deleteVehicle);

module.exports = router;