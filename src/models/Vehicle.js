const mongoose = require('mongoose');

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
    brand: {
        type: String, // Ví dụ: Toyota, Hyundai
        required: [true, 'Hãng xe là bắt buộc']
    },
    model: {
        type: String, // Ví dụ: Vios, Accent
        required: [true, 'Model xe là bắt buộc']
    },
    year: {
        type: Number,
        required: [true, 'Năm sản xuất là bắt buộc']
    },
    seats: {
        type: Number,
        required: [true, 'Số chỗ ngồi là bắt buộc'],
        min: 4
    },
    color: {
        type: String,
        default: 'Trắng'
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'rented', 'inactive'],
        default: 'active'
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
