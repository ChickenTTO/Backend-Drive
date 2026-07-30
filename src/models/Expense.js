const mongoose = require('mongoose');
const { EXPENSE_TYPE, TRANSACTION_STATUS } = require('../utils/constants');

const ExpenseSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Chuyến đi liên quan là bắt buộc']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(EXPENSE_TYPE),
    required: [true, 'Loại chi phí là bắt buộc']
  },
  amount: {
    type: Number,
    required: [true, 'Số tiền là bắt buộc'],
    min: [1000, 'Số tiền tối thiểu 1,000 VND']
  },
  description: {
    type: String,
    required: [true, 'Mô tả chi phí là bắt buộc']
  },
  receiptImage: {
    type: String,
    required: [true, 'Hình ảnh hóa đơn/biên lai là bắt buộc']
  },
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.PENDING
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  approvalNote: String,
  rejectionReason: String
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);