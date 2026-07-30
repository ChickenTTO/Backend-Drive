const express = require('express');
const router = express.Router();
const { createExpense, getAllExpenses, approveExpense, rejectExpense } = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/', createExpense);
router.get('/', getAllExpenses);
router.put('/:id/approve', authorize('admin', 'accountant'), approveExpense);
router.put('/:id/reject', authorize('admin', 'accountant'), rejectExpense);

module.exports = router;