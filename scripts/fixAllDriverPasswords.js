const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taxi_management';

async function fixDriverPasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // 1. Reset driver1 explicitly with password 'password123'
    let driver1 = await User.findOne({ username: 'driver1' });
    if (driver1) {
      driver1.password = 'password123';
      driver1.isActive = true;
      await driver1.save();
      console.log('✅ Updated driver1 password to "password123"');
    } else {
      await User.create({
        username: 'driver1',
        email: 'driver1@futaexpress.vn',
        password: 'password123',
        fullName: 'Nguyễn Văn A (Tài xế 01)',
        phone: '0903333301',
        role: 'driver',
        isActive: true
      });
      console.log('✅ Created driver1 with password "password123"');
    }

    // 2. Reset all drivers (driver1..driver25) password to 'password123'
    for (let i = 1; i <= 25; i++) {
      const uname = `driver${i}`;
      let drv = await User.findOne({ username: uname });
      if (drv) {
        drv.password = 'password123';
        drv.isActive = true;
        await drv.save();
        console.log(`✅ Fixed password for ${uname} -> "password123"`);
      }
    }

    console.log('🎉 Done fixing all driver passwords!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing driver passwords:', err);
    process.exit(1);
  }
}

fixDriverPasswords();
