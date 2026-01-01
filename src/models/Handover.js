const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OK', 'Có vấn đề', 'Cần bảo dưỡng'],
    required: true
  },
  note: String,
  photos: [String] // URLs của hình ảnh
}, { _id: false });

const handoverSchema = new mongoose.Schema({
  // Loại giao dịch
  type: {
    type: String,
    enum: ['CHECK_IN', 'CHECK_OUT'],
    required: true
  },
  
  // Thông tin xe và tài xế
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
  
  // Người xác nhận (có thể là dispatcher hoặc admin)
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Thời gian
  handoverTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Checklist chi tiết
  checklist: {
    // Ngoại thất
    exterior: {
      bodyCondition: checklistItemSchema,
      lights: checklistItemSchema,
      mirrors: checklistItemSchema,
      tires: checklistItemSchema,
      windshield: checklistItemSchema
    },
    
    // Nội thất
    interior: {
      seats: checklistItemSchema,
      dashboard: checklistItemSchema,
      airConditioner: checklistItemSchema,
      cleanliness: checklistItemSchema
    },
    
    // Vận hành
    operational: {
      engine: checklistItemSchema,
      brakes: checklistItemSchema,
      steering: checklistItemSchema,
      transmission: checklistItemSchema
    },
    
    // Nhiên liệu
    fuel: {
      level: {
        type: Number, // 0-100%
        required: true,
        min: 0,
        max: 100
      },
      photo: String
    },
    
    // Đồng hồ km
    odometer: {
      reading: {
        type: Number,
        required: true,
        min: 0
      },
      photo: String
    }
  },
  
  // Hình ảnh tổng quan (4 góc xe)
  overallPhotos: {
    front: String,
    back: String,
    left: String,
    right: String,
    dashboard: String
  },
  
  // Ghi chú chung
  generalNotes: String,
  
  // Vấn đề cần xử lý
  issues: [{
    description: String,
    severity: {
      type: String,
      enum: ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']
    },
    photos: [String],
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Trạng thái hoàn thành
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  // Chữ ký điện tử
  signatures: {
    driver: String, // Base64 hoặc URL
    confirmer: String
  }
}, {
  timestamps: true
});

// Index
handoverSchema.index({ vehicle: 1, handoverTime: -1 });
handoverSchema.index({ driver: 1, handoverTime: -1 });
handoverSchema.index({ type: 1, handoverTime: -1 });

// Middleware: Không cho sửa sau khi hoàn thành
handoverSchema.pre('save', function(next) {
  if (this.isCompleted && !this.isNew) {
    return next(new Error('Không thể chỉnh sửa checklist đã hoàn thành'));
  }
  next();
});

module.exports = mongoose.model('Handover', handoverSchema);