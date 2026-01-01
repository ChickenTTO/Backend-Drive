const mongoose = require('mongoose');
const { EXPENSE_TYPE, TRANSACTION_STATUS } = require('../utils/constants');

const expenseSchema = new mongoose.Schema({
  // Loại chi phí
  type: {
    type: String,
    enum: Object.values(EXPENSE_TYPE),
    required: true
  },
  
  // Mô tả chi tiết
  description: {
    type: String,
    required: true
  },
  
  // Số tiền
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Người tạo (có thể là dispatcher hoặc admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Người phê duyệt (kế toán hoặc admin)
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.PENDING
  },
  
  // Ngày chi phí
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Ngày phê duyệt
  approvedDate: Date,
  
  // Xe liên quan (nếu có)
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  
  // Chuyến đi liên quan (nếu có)
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  
  // File đính kèm (hóa đơn, biên lai, hình ảnh)
  attachments: [String],
  
  // Ghi chú
  notes: String,
  
  // Ghi chú phê duyệt
  approvalNote: String,
  
  // Lý do từ chối
  rejectionReason: String
}, {
  timestamps: true
});

// Index
expenseSchema.index({ type: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ vehicle: 1 });

module.exports = mongoose.model('Expense', expenseSchema);