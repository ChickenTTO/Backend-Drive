const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  assignTrip,
  updateTripStatus,
  addNote,
  updateTrip,
  deleteTrip,
  getActiveTripsOfVehicle
} = require('../controllers/trip.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect); // Tất cả routes cần authentication

// Routes cho tất cả user đã đăng nhập
router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/:id/note', addNote);

// Routes cho Driver
router.patch(
  '/:id/status',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER),
  updateTripStatus
);

// Routes cho Admin và Dispatcher
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  createTrip
);

router.patch(
  '/:id/assign',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  assignTrip
);

router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  updateTrip
);

router.get(
  '/vehicle/:vehicleId/active',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getActiveTripsOfVehicle
);

// Admin only
router.delete('/:id', authorize(USER_ROLES.ADMIN), deleteTrip);

module.exports = router;