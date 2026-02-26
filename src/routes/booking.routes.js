const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');
const bookingController = require('../controllers/booking.controller');

// All booking routes require authentication
router.use(protect);

// GET bookings (Admin, Dispatcher)
router.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.getAll
);

router.get(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.getById
);

// POST/PUT bookings (Admin, Dispatcher)
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.create
);

router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  bookingController.update
);

module.exports = router;
