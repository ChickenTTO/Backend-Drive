const express = require('express');
const router = express.Router();
const { createTrip, getAllTrips, getTripById, updateTripStatus } = require('../controllers/trip.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/', authorize('admin', 'dispatcher'), createTrip);
router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.put('/:id/status', updateTripStatus);

module.exports = router;
