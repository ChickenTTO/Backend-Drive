const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    tripCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Chuyến xe hàng hóa Futa Express
    cargoType: {
        type: String,
        default: 'Hàng hóa & Bưu chính Futa'
    },
    cargoWeightTon: {
        type: Number,
        default: 1.0
    },
    startDepot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Depot',
        required: false
    },
    endDepot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Depot',
        required: false
    },
    // Địa điểm & Khách hàng (Form gốc)
    startLocation: {
        type: String,
        default: 'Bãi xe Futa Express'
    },
    endLocation: {
        type: String,
        default: 'Điểm giao hàng'
    },
    customerName: String,
    customerPhone: String,
    fare: {
        type: Number,
        default: 0
    },
    distance: {
        type: Number,
        default: 0
    },
    // Nhân sự & Phương tiện
    dispatcher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: false
    },
    // Thời gian & Thông số vận hành
    startTime: {
        type: Date,
        default: Date.now
    },
    estimatedEndTime: Date,
    endTime: Date,
    startOdometer: {
        type: Number,
        default: 0
    },
    endOdometer: {
        type: Number,
        default: 0
    },
    startFuelLevel: {
        type: Number,
        default: 100
    },
    endFuelLevel: {
        type: Number,
        default: 100
    },
    status: {
        type: String,
        default: 'Đang chờ'
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);