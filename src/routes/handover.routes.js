const express = require('express');
const router = express.Router();
const {
  createHandover,
  getHandovers,
  getHandoverById,
  completeHandover
} = require('../controllers/handover.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// Driver có thể tạo handover
router.post(
  '/check-in',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER),
  createHandover
);

router.post(
  '/check-out',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER),
  createHandover
);

// Xem danh sách
router.get('/', getHandovers);
router.get('/:id', getHandoverById);

// Admin và Dispatcher xác nhận hoàn thành
router.patch(
  '/:id/complete',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  completeHandover
);

module.exports = router;