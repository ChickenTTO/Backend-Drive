const express = require('express');
const router = express.Router();
const { createTrip, getAllTrips, getTripById, updateTrip, updateTripStatus, cancelTrip, dispatchTrip, recommendVehicles } = require('../controllers/trip.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/', authorize('admin', 'dispatcher'), createTrip);
router.get('/', getAllTrips);
router.get('/recommend-vehicles', authorize('admin', 'dispatcher'), recommendVehicles);
router.get('/:id', getTripById);
router.put('/:id', authorize('admin', 'dispatcher'), updateTrip);
router.put('/:id/status', updateTripStatus);
router.put('/:id/cancel', authorize('admin', 'dispatcher'), cancelTrip);
router.put('/:id/dispatch', authorize('admin', 'dispatcher'), dispatchTrip);

module.exports = router;
