const mongoose = require('mongoose');
const { VEHICLE_STATUS, WEIGHT_CATEGORY } = require('../utils/constants');

const MaintenanceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    type: { 
        type: String, 
        enum: ['periodic', 'repair', 'inspection', 'tire'], 
        required: true 
    },
    description: { type: String },
    cost: { type: Number, default: 0 },
    provider: { type: String },
    odometer: { type: Number, default: 0 }
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: [true, 'Biển số xe là bắt buộc'],
        unique: true,
        trim: true
    },
    barcode: {
        type: String,
        required: [true, 'Mã vạch xe là bắt buộc'],
        unique: true,
        trim: true
    },
    brand: {
        type: String, // Ví dụ: Hino, Isuzu, Hyundai
        required: [true, 'Hãng xe là bắt buộc']
    },
    model: {
        type: String,
        required: [true, 'Model xe là bắt buộc']
    },
    year: {
        type: Number,
        required: [true, 'Năm sản xuất là bắt buộc']
    },
    weightCategory: {
        type: String,
        enum: Object.values(WEIGHT_CATEGORY),
        required: [true, 'Phân loại tải trọng là bắt buộc']
    },
    maxPayloadTon: {
        type: Number, // Khối lượng chở tối đa (tấn)
        required: true,
        default: 3.5
    },
    depot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Depot',
        required: [true, 'Bãi xe trực thuộc là bắt buộc']
    },
    status: {
        type: String,
        enum: Object.values(VEHICLE_STATUS),
        default: VEHICLE_STATUS.READY
    },
    odometer: {
        type: Number,
        default: 0
    },
    fuelLevel: {
        type: Number, // Số lít nhiên liệu (Lít)
        default: 70
    },
    fuelLiters: {
        type: Number, // Số lít nhiên liệu (Lít)
        default: 70
    },
    currentDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    maintenanceHistory: {
        type: [MaintenanceSchema],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
