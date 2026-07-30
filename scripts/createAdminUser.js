const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taxi_management';

const createAdminDat = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Connected to MongoDB');

        const username = 'adminDat';
        const rawPassword = 'Dat@2005';

        let user = await User.findOne({ username });

        if (user) {
            user.password = rawPassword;
            user.role = 'admin';
            user.isActive = true;
            await user.save();
            console.log(`✅ Updated existing account "${username}" with new password and admin role.`);
        } else {
            user = await User.create({
                username,
                email: 'adminDat@futaexpress.vn',
                password: rawPassword,
                fullName: 'Quản Trị Viên (adminDat)',
                phone: '0909999999',
                role: 'admin',
                isActive: true
            });
            console.log(`✅ Successfully created new admin account "${username}"!`);
        }

        console.log('-----------------------------------');
        console.log(`👤 Username: ${username}`);
        console.log(`🔑 Password: ${rawPassword}`);
        console.log(`🛡️ Role: admin`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin account:', error);
        process.exit(1);
    }
};

createAdminDat();
