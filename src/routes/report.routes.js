const express = require('express');
const router = express.Router();
const {
  getRevenueByVehicle,
  getRevenueByStaff,
  getExpensesReport,
  getDashboard,
  getDriverPerformance,
  getRevenueByTime
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// Dashboard (Admin only)
router.get(
  '/dashboard',
  authorize(USER_ROLES.ADMIN),
  getDashboard
);

// Revenue reports (Admin và Accountant)
router.get(
  '/revenue-by-car',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  getRevenueByVehicle
);

router.get(
  '/revenue-by-time',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  getRevenueByTime
);

// Staff commission (Admin only)
router.get(
  '/revenue-by-staff',
  authorize(USER_ROLES.ADMIN),
  getRevenueByStaff
);

// Expense reports (Admin và Accountant)
router.get(
  '/expenses',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  getExpensesReport
);

// Driver performance (Admin và Dispatcher)
router.get(
  '/driver-performance',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDriverPerformance
);

module.exports = router;