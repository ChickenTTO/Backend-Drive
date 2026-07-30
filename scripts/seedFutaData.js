const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Depot = require('../src/models/Depot');
const Vehicle = require('../src/models/Vehicle');
const Trip = require('../src/models/Trip');
const Handover = require('../src/models/Handover');
const Expense = require('../src/models/Expense');
const { DEPOT_LOCATIONS, WEIGHT_CATEGORY, VEHICLE_STATUS, TRIP_STATUS, TRANSACTION_STATUS, EXPENSE_TYPE } = require('../src/utils/constants');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taxi_management';

const driverNames = [
  'Lê Văn Tài', 'Phạm Minh Đức', 'Nguyễn Hoàng Nam', 'Trần Quốc Bảo', 'Vũ Tuấn Anh',
  'Đặng Huy Hoàng', 'Bùi Quang Huy', 'Ngô Thành Trung', 'Hoàng Trọng Hiếu', 'Đỗ Minh Trí',
  'Nguyễn Thanh Tùng', 'Lý Văn Hùng', 'Đinh Văn Lâm', 'Trịnh Tấn Phát', 'Võ Văn Kiệt',
  'Dương Hải Đăng', 'Phan Văn Nhật', 'Huỳnh Tấn Đạt', 'Mai Quốc Tuấn', 'Cao Minh Lộc',
  'Nguyễn Hoàng Long', 'Trương Văn Thịnh', 'Hồ Hữu Phước', 'Lâm Quốc Cường', 'Đào Văn Sang'
];

const seedFutaData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Connected to MongoDB:', MONGO_URI);

        // 1. Clear existing data
        await User.deleteMany({});
        await Depot.deleteMany({});
        await Vehicle.deleteMany({});
        await Trip.deleteMany({});
        await Handover.deleteMany({});
        await Expense.deleteMany({});
        console.log('🧹 Cleared old collections.');

        // 2. Create Core Users
        const admin = await User.create({
            username: 'admin',
            email: 'admin@futaexpress.vn',
            password: 'password123',
            fullName: 'Nguyễn Văn Quản Trị (Admin)',
            phone: '0901111111',
            role: 'admin'
        });

        const dispatcher = await User.create({
            username: 'dispatcher',
            email: 'dieuhanh@futaexpress.vn',
            password: 'password123',
            fullName: 'Trần Thị Điều Hành (Dispatcher)',
            phone: '0902222222',
            role: 'dispatcher'
        });

        const accountant = await User.create({
            username: 'accountant',
            email: 'ketoan@futaexpress.vn',
            password: 'password123',
            fullName: 'Hoàng Kim Kế Toán (Accountant)',
            phone: '0905555555',
            role: 'accountant'
        });

        // Create 25 Drivers
        const createdDrivers = [];
        for (let i = 0; i < driverNames.length; i++) {
            const index = i + 1;
            const seqStr = String(index).padStart(2, '0');
            const driver = await User.create({
                username: `driver${index}`,
                email: `taixe${index}@futaexpress.vn`,
                password: 'password123',
                fullName: `${driverNames[i]} (Tài xế ${seqStr})`,
                phone: `09033333${seqStr}`,
                role: 'driver'
            });
            createdDrivers.push(driver);
        }

        console.log(`👤 Created Admin, Dispatcher, Accountant & ${createdDrivers.length} Drivers.`);

        // 3. Create 05 Depots
        const createdDepots = [];
        for (const loc of DEPOT_LOCATIONS) {
            const depot = await Depot.create({
                code: loc.code,
                name: loc.name,
                city: loc.city,
                address: loc.address,
                area: loc.area,
                totalCapacity: loc.totalCapacity,
                manager: dispatcher._id
            });
            createdDepots.push(depot);
        }
        console.log('🏛️ Created 05 Futa Express Depots (HN, HP, DN, HCM, CT)');

        // 4. Create 55 Trucks with Barcodes
        const brands = ['Hino 300', 'Isuzu NPR', 'Hyundai Mighty', 'Howo A7', 'Chenglong H7'];
        const weightCategories = [
            { category: WEIGHT_CATEGORY.LIGHT, payload: 2.5 },
            { category: WEIGHT_CATEGORY.MEDIUM, payload: 7.5 },
            { category: WEIGHT_CATEGORY.HEAVY, payload: 20.0 }
        ];

        const createdVehicles = [];
        let truckCount = 1;

        for (let dIdx = 0; dIdx < createdDepots.length; dIdx++) {
            const depot = createdDepots[dIdx];
            for (let i = 0; i < 11; i++) {
                const seq = String(truckCount).padStart(3, '0');
                const barcode = `FUTA-TRK-${seq}`;
                const plateNum = Math.floor(1000 + Math.random() * 9000);
                const provinceCode = depot.code === 'HN' ? '29H' : depot.code === 'HP' ? '15C' : depot.code === 'DN' ? '43C' : depot.code === 'HCM' ? '51D' : '65C';
                const licensePlate = `${provinceCode}-${plateNum}`;

                const weightObj = weightCategories[i % 3];
                const brand = brands[i % brands.length];

                const vehicle = await Vehicle.create({
                    licensePlate,
                    barcode,
                    brand: brand.split(' ')[0],
                    model: brand,
                    year: 2022 + (i % 3),
                    weightCategory: weightObj.category,
                    maxPayloadTon: weightObj.payload,
                    depot: depot._id,
                    driver: createdDrivers[i % createdDrivers.length]._id,
                    status: i === 0 ? VEHICLE_STATUS.OPERATING : VEHICLE_STATUS.READY,
                    odometer: 15000 + (truckCount * 320),
                    fuelLevel: 85 + (i % 15)
                });

                createdVehicles.push(vehicle);
                truckCount++;
            }
        }
        console.log(`🚛 Created ${createdVehicles.length} Trucks with Barcodes spread across 5 Depots.`);

        // 5. Create Sample Active Trip
        const hcmDepot = createdDepots.find(d => d.code === 'HCM');
        const dnDepot = createdDepots.find(d => d.code === 'DN');
        const activeTruck = createdVehicles.find(v => v.status === VEHICLE_STATUS.OPERATING);

        const sampleTrip = await Trip.create({
            tripCode: 'FUTA-20260730-9988',
            cargoType: 'Hàng Linh Kiện Điện Tử & Bưu Chính Express',
            cargoWeightTon: 6.5,
            startDepot: hcmDepot._id,
            endDepot: dnDepot._id,
            dispatcher: dispatcher._id,
            driver: createdDrivers[0]._id,
            vehicle: activeTruck._id,
            startOdometer: activeTruck.odometer - 120,
            startFuelLevel: 95,
            notes: 'Hàng gấp cần vận chuyển an toàn qua QL1A',
            status: TRIP_STATUS.IN_TRANSIT
        });

        // 6. Create Check-out Handover
        await Handover.create({
            type: 'CHECK_OUT',
            trip: sampleTrip._id,
            vehicle: activeTruck._id,
            driver: createdDrivers[0]._id,
            depot: hcmDepot._id,
            barcode: activeTruck.barcode,
            odometerReading: activeTruck.odometer - 120,
            fuelLevelPercent: 95,
            photos: {
                cabin: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
                cargoBox: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
                tires: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
                odometer: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
                fuelGauge: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80'
            },
            generalNotes: 'Lốp xe đảm bảo, thùng xe sạch sẽ, đủ kẹp chì Niêm phong Futa Express.',
            isCompleted: true
        });

        // 7. Create Sample Roadside Expense Claims
        await Expense.create({
            trip: sampleTrip._id,
            vehicle: activeTruck._id,
            driver: createdDrivers[0]._id,
            type: EXPENSE_TYPE.TOLL_BOT,
            amount: 180000,
            description: 'Qua trạm phí BOT Phan Thiết (Xe 7.5 tấn)',
            receiptImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
            status: TRANSACTION_STATUS.PENDING
        });

        await Expense.create({
            trip: sampleTrip._id,
            vehicle: activeTruck._id,
            driver: createdDrivers[0]._id,
            type: EXPENSE_TYPE.FUEL,
            amount: 1500000,
            description: 'Đổ 70 lít dầu Diesel tại cây xăng Petrolimex Bình Thuận',
            receiptImage: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
            status: TRANSACTION_STATUS.APPROVED,
            approvedBy: accountant._id,
            approvalDate: new Date(),
            approvalNote: 'Đã khớp số lít và hóa đơn VAT hợp lệ.'
        });

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedFutaData();
