const mongoose = require('mongoose');

const HandoverSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['CHECK_OUT', 'CHECK_IN'], // CHECK_OUT: Nhận xe đi chuyến, CHECK_IN: Trả xe về bãi
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
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
  depot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  barcode: {
    type: String,
    required: true
  },
  handoverTime: {
    type: Date,
    default: Date.now
  },
  odometerReading: {
    type: Number,
    required: [true, 'Số Km công-tơ-mét là bắt buộc'],
    min: 0
  },
  fuelLevelPercent: {
    type: Number,
    required: [true, 'Mức nhiên liệu (%) là bắt buộc'],
    min: 0,
    max: 100
  },
  // Hình ảnh minh chứng bắt buộc
  photos: {
    cabin: { type: String, required: true },      // Ảnh cabin xe
    cargoBox: { type: String, required: true },   // Ảnh thùng xe
    tires: { type: String, required: true },      // Ảnh lốp xe
    odometer: String,
    fuelGauge: String
  },
  generalNotes: String,
  isCompleted: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Lock modification if completed
HandoverSchema.pre('save', function() {
  if (this.isCompleted && !this.isNew) {
    throw new Error('Biên bản bàn giao điện tử đã khóa, không được chỉnh sửa.');
  }
});


module.exports = mongoose.model('Handover', HandoverSchema);