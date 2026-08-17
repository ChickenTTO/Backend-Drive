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
    fullName: 'Dispatcher User 1',
    phone: '0901234568'
  },
  {
    username: 'dispatcher2',
    email: 'dispatcher2@gmail.com',
    password: 'dispatcher123',
    role: 'dispatcher',
    fullName: 'Dispatcher User 2',
    phone: '0901234569'
  },
  {
    username: 'accountant1',
    email: 'accountant1@gmail.com',
    password: 'accountant123',
    role: 'accountant',
    fullName: 'Accountant User 1',
    phone: '0901234570'
  },
  {
    username: 'accountant2',
    email: 'accountant2@gmail.com',
    password: 'accountant123',
    role: 'accountant',
    fullName: 'Accountant User 2',
    phone: '0901234571'
  },
  {
    username: 'driver1',
    email: 'driver1@gmail.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Nguyen Van A (Driver 1)',
    phone: '0909888771'
  },
  {
    username: 'driver2',
    email: 'driver2@gmail.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Tran Van B (Driver 2)',
    phone: '0909888772'
  },
  {
    username: 'driver3',
    email: 'driver3@gmail.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Le Van C (Driver 3)',
    phone: '0909888773'
  },
  {
    username: 'driver4',
    email: 'driver4@gmail.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Pham Van D (Driver 4)',
    phone: '0909888774'
  },
  {
    username: 'driver5',
    email: 'driver5@gmail.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Hoang Van E (Driver 5)',
    phone: '0909888775'
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
    
    await User.create(users);

    console.log('✅ Users Data Imported Successfully!');
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