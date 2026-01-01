const mongoose = require('mongoose');
const { TRANSACTION_STATUS, TRANSACTION_TYPE } = require('../utils/constants');

const transactionSchema = new mongoose.Schema({
  // Loại giao dịch
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: true
  },
  
  // Người thực hiện (tài xế hoặc nhân viên)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Người xác nhận (kế toán)
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Số tiền
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.PENDING
  },
  
  // Mô tả
  description: String,
  
  // Ngày giao dịch
  transactionDate: {
    type: Date,
    default: Date.now
  },
  
  // Ngày xác nhận
  confirmedDate: Date,
  
  // Phương thức thanh toán
  paymentMethod: {
    type: String,
    enum: ['Tiền mặt', 'Chuyển khoản', 'Ví điện tử'],
    default: 'Tiền mặt'
  },
  
  // Đối với nộp tiền: danh sách các chuyến đi
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  
  // Đối với chi phí: liên quan đến xe nào
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  
  // File đính kèm (hóa đơn, biên lai)
  attachments: [String],
  
  // Ghi chú từ kế toán
  accountantNote: String,
  
  // Lý do từ chối (nếu có)
  rejectionReason: String
}, {
  timestamps: true
});

// Index
transactionSchema.index({ createdBy: 1, transactionDate: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);