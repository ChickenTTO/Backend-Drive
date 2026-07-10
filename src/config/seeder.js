const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// 1. Config Dotenv
dotenv.config({ path: './.env' });

// 2. Import Models
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

// 3. Connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected for Seeding...'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// 4. Dữ liệu mẫu
const users = [
  {
    username: 'admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin',
    fullName: 'Admin User',
    phone: '0901234567'
  },
  {
    username: 'adminDat',
    email: 'Dat@gmail.com',
    password: 'Dat@2005',
    role: 'admin',
    fullName: 'Admin User',
    phone: '0901234567'
  },
  {
    username: 'dispatcher1',
    email: 'dispatcher1@gmail.com',
    password: 'dispatcher123',
    role: 'dispatcher',
    fullName: 'Dispatcher User',
    phone: '0901234568'
  },
  {
    username: 'accountant1',
    email: 'accountant1@gmail.com',
    password: 'accountant123',
    role: 'accountant',
    fullName: 'Accountant User',
    phone: '0901234569'
  },
  {
    username: 'driver1',
    email: 'driver1@gmail.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Nguyen Van A',
    phone: '0909888777'
  }
];

// --- ĐÃ SỬA: Thêm model, year, seats ---
const vehicles = [
  {
    licensePlate: '29A-123.45',
    brand: 'Toyota',
    model: 'Vios',       // <-- Thêm mới
    year: 2023,          // <-- Thêm mới
    seats: 4,            // <-- Thêm mới
    color: 'Trắng',
    status: 'active'
  },
  {
    licensePlate: '30E-999.99',
    brand: 'Toyota',
    model: 'Innova',     // <-- Thêm mới
    year: 2022,          // <-- Thêm mới
    seats: 7,            // <-- Thêm mới
    color: 'Bạc',
    status: 'maintenance'
  }
];

const importData = async () => {
  try {
    await User.deleteMany();
    await Vehicle.deleteMany();
    await Trip.deleteMany();
    
    await User.create(users);
    await Vehicle.create(vehicles);

    console.log('✅ Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error Importing Data:', error);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await User.deleteMany();
    await Vehicle.deleteMany();
    await Trip.deleteMany();

    console.log('✅ Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error('❌ Error Destroying Data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please run with -i (import) or -d (delete)');
  process.exit();
}