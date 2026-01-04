const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriverById,
  createDriver, // <--- THÊM DÒNG NÀY (Nhớ kiểm tra tên hàm trong controller)
  updateDriver,
  getDriverTrips,
  deactivateDriver
} = require('../controllers/driver.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// --- Admin và Dispatcher ---

// 1. GET: Lấy danh sách
router.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDrivers
);

// 2. POST: Thêm mới tài xế (DÒNG BẠN ĐANG THIẾU)
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER), // Phân quyền tùy bạn chọn
  createDriver 
);

// --- Các route khác giữ nguyên ---
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