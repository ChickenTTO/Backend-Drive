const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getTripsByPhone,
  updateCustomer
} = require('../controllers/customer.controller');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

// Tất cả route cần đăng nhập
router.use(protect);

// Lấy danh sách khách hàng (Admin, Dispatcher)
router.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getCustomers
);

// Lấy chi tiết khách hàng theo ID (Admin, Dispatcher)
router.get(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getCustomerById
);

// Lấy lịch sử chuyến đi theo số điện thoại (Admin, Dispatcher)
router.get(
  '/phone/:phone/trips',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  getTripsByPhone
);

// Thêm khách mới (Admin, Dispatcher)
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  async (req, res, next) => {
    try {
      const newCustomer = await Customer.create(req.body);
      res.status(201).json(newCustomer);
    } catch (err) {
      next(err);
    }
  }
);

// Cập nhật khách hàng (Admin, Dispatcher)
router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  updateCustomer
);

// Xóa khách hàng (Admin only)
router.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const deleted = await Customer.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      res.json({ message: 'Xóa thành công' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
