const express = require('express');
const router = express.Router();
const {
  createDeposit,
  getTransactions,
  confirmTransaction,
  rejectTransaction,
  getUnpaidAmount
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// Driver routes
router.post(
  '/deposit',
  authorize(USER_ROLES.DRIVER),
  createDeposit
);

router.get(
  '/driver/unpaid',
  authorize(USER_ROLES.DRIVER),
  getUnpaidAmount
);

// All can view transactions
router.get('/', getTransactions);

// Accountant và Admin
router.patch(
  '/:id/confirm',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  confirmTransaction
);

router.patch(
  '/:id/reject',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  rejectTransaction
);

module.exports = router;