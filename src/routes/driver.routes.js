const express = require("express");
const router = express.Router();
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  getDriverTrips,
  deleteDriver, // <--- ĐÃ SỬA: Đổi từ deactivateDriver thành deleteDriver
} = require("../controllers/driver.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { USER_ROLES } = require("../utils/constants");

router.use(protect);

// --- Admin và Dispatcher ---

// 1. GET: Lấy danh sách
router.get("/", authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER), getDrivers);

// 2. POST: Thêm mới tài xế
router.post(
  "/",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  createDriver,
);

// --- Các route khác giữ nguyên ---
router.get(
  "/:id",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDriverById,
);

router.put(
  "/:id",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  updateDriver,
);

router.get(
  "/:id/trips",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getDriverTrips,
);

// Admin only
// ĐÃ SỬA: Thay deactivateDriver bằng deleteDriver để thực hiện xóa vĩnh viễn
router.delete("/:id", authorize(USER_ROLES.ADMIN), deleteDriver);

module.exports = router;
