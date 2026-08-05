const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taxi_management';

const accounts = [
  { username: 'adminDat', password: 'Dat@2005', role: 'admin', fullName: 'Quản Trị Viên (adminDat)', phone: '0909999999', email: 'adminDat@futaexpress.vn' },
  { username: 'admin', password: 'admin123', role: 'admin', fullName: 'Quản Trị Viên Admin', phone: '0901234567', email: 'admin@gmail.com' },
  { username: 'dispatcher1', password: 'dispatcher123', role: 'dispatcher', fullName: 'Điều Xe Viên', phone: '0901234568', email: 'dispatcher1@gmail.com' },
  { username: 'accountant1', password: 'accountant123', role: 'accountant', fullName: 'Kế Toán Viên', phone: '0901234569', email: 'accountant1@gmail.com' },
  { username: 'driver1', password: 'driver123', role: 'driver', fullName: 'Tài Xế Nguyễn Văn A', phone: '0909888777', email: 'driver1@gmail.com' }
];

async function resetUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    for (const acc of accounts) {
      let user = await User.findOne({ username: acc.username });
      if (user) {
        user.password = acc.password;
        user.role = acc.role;
        user.isActive = true;
        await user.save();
        console.log(`✅ Updated account: ${acc.username}`);
      } else {
        await User.create(acc);
        console.log(`✅ Created account: ${acc.username}`);
      }
    }

    console.log('🎉 All test accounts successfully reset!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting users:', err);
    process.exit(1);
  }
}

resetUsers();
