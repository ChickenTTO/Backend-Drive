const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getTripsByPhone,
  updateCustomer
} = require('../controllers/customer.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// All authenticated users
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/phone/:phone/trips', getTripsByPhone);

// Admin và Dispatcher
router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  updateCustomer
);

module.exports = router;