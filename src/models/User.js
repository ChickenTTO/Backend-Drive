const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Tên đăng nhập là bắt buộc'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Vui lòng nhập email hợp lệ'
        ]
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: 6,
        select: false 
    },
    role: {
        type: String,
        enum: ['admin', 'dispatcher', 'driver', 'accountant', 'customer', 'staff'],
        default: 'customer'
    },
    fullName: {
        type: String,
        required: [true, 'Họ tên là bắt buộc']
    },
    phone: {
        type: String,
        required: [true, 'Số điện thoại là bắt buộc']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- SỬA LỖI TẠI ĐÂY ---
// 1. Xóa chữ 'next' trong ngoặc ()
// 2. Không gọi next() ở cuối nữa
UserSchema.pre('save', async function() {
    // Nếu password không đổi thì return luôn
    if (!this.isModified('password')) {
        return; 
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Kết thúc hàm async tự động báo hiệu cho Mongoose biết là đã xong
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);