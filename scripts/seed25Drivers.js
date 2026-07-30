const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taxi_management';

const driverList = [
  { name: 'Lê Văn Tài', phone: '0903333301' },
  { name: 'Phạm Minh Đức', phone: '0903333302' },
  { name: 'Nguyễn Hoàng Nam', phone: '0903333303' },
  { name: 'Trần Quốc Bảo', phone: '0903333304' },
  { name: 'Vũ Tuấn Anh', phone: '0903333305' },
  { name: 'Đặng Huy Hoàng', phone: '0903333306' },
  { name: 'Bùi Quang Huy', phone: '0903333307' },
  { name: 'Ngô Thành Trung', phone: '0903333308' },
  { name: 'Hoàng Trọng Hiếu', phone: '0903333309' },
  { name: 'Đỗ Minh Trí', phone: '0903333310' },
  { name: 'Nguyễn Thanh Tùng', phone: '0903333311' },
  { name: 'Lý Văn Hùng', phone: '0903333312' },
  { name: 'Đinh Văn Lâm', phone: '0903333313' },
  { name: 'Trịnh Tấn Phát', phone: '0903333314' },
  { name: 'Võ Văn Kiệt', phone: '0903333315' },
  { name: 'Dương Hải Đăng', phone: '0903333316' },
  { name: 'Phan Văn Nhật', phone: '0903333317' },
  { name: 'Huỳnh Tấn Đạt', phone: '0903333318' },
  { name: 'Mai Quốc Tuấn', phone: '0903333319' },
  { name: 'Cao Minh Lộc', phone: '0903333320' },
  { name: 'Nguyễn Hoàng Long', phone: '0903333321' },
  { name: 'Trương Văn Thịnh', phone: '0903333322' },
  { name: 'Hồ Hữu Phước', phone: '0903333323' },
  { name: 'Lâm Quốc Cường', phone: '0903333324' },
  { name: 'Đào Văn Sang', phone: '0903333325' }
];

const seedDrivers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Connected to MongoDB:', MONGO_URI);

        let createdCount = 0;
        let updatedCount = 0;

        for (let i = 0; i < driverList.length; i++) {
            const index = i + 1;
            const item = driverList[i];
            const username = `driver${index}`;
            const email = `taixe${index}@futaexpress.vn`;

            const existing = await User.findOne({ 
                $or: [{ username }, { phone: item.phone }, { email }]
            });

            if (!existing) {
                await User.create({
                    username,
                    email,
                    password: 'password123',
                    fullName: `${item.name} (Tài xế ${String(index).padStart(2, '0')})`,
                    phone: item.phone,
                    role: 'driver'
                });
                createdCount++;
            } else {
                existing.fullName = `${item.name} (Tài xế ${String(index).padStart(2, '0')})`;
                existing.phone = item.phone;
                existing.role = 'driver';
                await existing.save();
                updatedCount++;
            }
        }

        console.log(`✅ Thành công! Đã khởi tạo 25 tài xế Futa Express (Tạo mới: ${createdCount}, Cập nhật: ${updatedCount})`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi tạo tài xế:', err);
        process.exit(1);
    }
};

seedDrivers();
