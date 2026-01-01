const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriverById,
  updateDriver,
  getDriverTrips,
  deactivateDriver
} = require('../controllers/driver.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// Admin và Dispatcher
router.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDrivers
);

router.get(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDriverById
);

router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  updateDriver
);

router.get(
  '/:id/trips',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDriverTrips
);

// Admin only
router.delete('/:id', authorize(USER_ROLES.ADMIN), deactivateDriver);

module.exports = router;