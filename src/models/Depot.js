const mongoose = require('mongoose');

const DepotSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Tên bãi xe là bắt buộc'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'Thành phố là bắt buộc']
    },
    address: {
        type: String,
        required: [true, 'Địa chỉ là bắt buộc']
    },
    area: {
        type: Number, // Diện tích (m2)
        default: 10000
    },
    totalCapacity: {
        type: Number, // Tổng sức chứa xe
        default: 20
    },
    capacityByWeight: {
        light: { type: Number, default: 8 },    // Tải nhẹ 1.5 - 3.5t
        medium: { type: Number, default: 7 },   // Tải trung 5 - 8t
        heavy: { type: Number, default: 5 }     // Tải nặng 15 - 30t
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Depot', DepotSchema);
