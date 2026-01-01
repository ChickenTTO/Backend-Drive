const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    tripCode: {
        type: String,
        required: true,
        unique: true, // Đã đủ tạo index, KHÔNG thêm dòng index: true
        trim: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    startLocation: {
        type: String,
        required: true
    },
    endLocation: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'cancelled'],
        default: 'ongoing'
    },
    distance: Number,
    fare: Number,
    customerName: String, // Tạm thời để string đơn giản
    customerPhone: String
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);