const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');
const bookingController = require('../controllers/booking.controller');

// All booking routes require authentication
router.use(protect);

// GET bookings (Admin, Dispatcher, Driver, Accountant)
router.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER, USER_ROLES.ACCOUNTANT),
  bookingController.getAll
);

router.get(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER, USER_ROLES.ACCOUNTANT),
  bookingController.getById
);

// POST bookings (Admin, Dispatcher)
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.create
);

router.put(
  '/:id/assign',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.assignDriver
);

router.put(
  '/:id/status',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER),
  bookingController.updateStatus
);

router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.update
);

module.exports = router;
