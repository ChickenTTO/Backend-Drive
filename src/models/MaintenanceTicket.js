const mongoose = require('mongoose');

const MaintenanceTicketSchema = new mongoose.Schema({
    ticketCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    licensePlate: {
        type: String,
        required: [true, 'Biển số xe là bắt buộc'],
        trim: true
    },
    brand: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        required: [true, 'Loại bảo dưỡng là bắt buộc'],
        default: 'Bảo dưỡng định kỳ'
    },
    issue: {
        type: String,
        required: [true, 'Nội dung bảo dưỡng là bắt buộc']
    },
    garage: {
        type: String,
        default: 'Trung tâm Bảo dưỡng Futa Express'
    },
    estimatedCost: {
        type: Number,
        default: 0
    },
    actualCost: {
        type: Number,
        default: 0
    },
    odometer: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Chờ bảo dưỡng', 'Đang bảo dưỡng', 'Hoàn thành', 'Đã hủy'],
        default: 'Chờ bảo dưỡng'
    },
    partsReplaced: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    completedDate: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);
