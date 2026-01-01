const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

// Import controller (sẽ tạo sau)
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  approveExpense,
  rejectExpense,
  deleteExpense
} = require('../controllers/expense.controller');

router.use(protect);

// Dispatcher và Admin tạo chi phí
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  createExpense
);

// Xem danh sách
router.get('/', getExpenses);
router.get('/:id', getExpenseById);

// Cập nhật (chỉ người tạo hoặc Admin)
router.put('/:id', updateExpense);

// Kế toán và Admin phê duyệt/từ chối
router.patch(
  '/:id/approve',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  approveExpense
);

router.patch(
  '/:id/reject',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT),
  rejectExpense
);

// Admin xóa
router.delete('/:id', authorize(USER_ROLES.ADMIN), deleteExpense);

module.exports = router;