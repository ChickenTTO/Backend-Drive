const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getTripsByPhone,
  updateCustomer
} = require('../controllers/customer.controller');

// Lấy danh sách khách hàng
router.get('/', getCustomers);

// Lấy chi tiết khách hàng theo ID
router.get('/:id', getCustomerById);

// Lấy lịch sử chuyến đi theo số điện thoại
router.get('/phone/:phone/trips', getTripsByPhone);

// Thêm khách mới (POST)
router.post('/', async (req, res, next) => {
  try {
    const Customer = require('../models/Customer');
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (err) {
    next(err);
  }
});

// Cập nhật khách hàng (PUT)
router.put('/:id', updateCustomer);

// Xóa khách hàng (DELETE)
router.delete('/:id', async (req, res, next) => {
  try {
    const Customer = require('../models/Customer');
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
