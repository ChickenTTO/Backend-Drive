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
            password: 'admin123',
            fullName: 'Nguyễn Văn Quản Trị (Admin)',
            phone: '0901111111',
            role: 'admin'
        });

        await User.create({
            username: 'adminDat',
            email: 'admin.dat@futaexpress.vn',
            password: 'Dat@2005',
            fullName: 'Admin Quốc Đạt',
            phone: '0901111222',
            role: 'admin'
        });

        const dispatcher = await User.create({
            username: 'dispatcher',
            email: 'dieuhanh@futaexpress.vn',
            password: 'dispatcher123',
            fullName: 'Trần Thị Điều Hành (Dispatcher)',
            phone: '0902222222',
            role: 'dispatcher'
        });

        await User.create({
            username: 'dispatcher1',
            email: 'dieuhanh1@futaexpress.vn',
            password: 'dispatcher123',
            fullName: 'Nguyễn Điều Hành 1',
            phone: '0902222333',
            role: 'dispatcher'
        });

        const accountant = await User.create({
            username: 'accountant',
            email: 'ketoan@futaexpress.vn',
            password: 'accountant123',
            fullName: 'Hoàng Kim Kế Toán (Accountant)',
            phone: '0905555555',
            role: 'accountant'
        });

        await User.create({
            username: 'accountant1',
            email: 'ketoan1@futaexpress.vn',
            password: 'accountant123',
            fullName: 'Phạm Kế Toán 1',
            phone: '0905555666',
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
                password: 'driver123',
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

        // 4. Create 55 Trucks with Barcodes & Link Current Drivers
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
                const assignedDriver = createdDrivers[(truckCount - 1) % createdDrivers.length];

                const vehicle = await Vehicle.create({
                    licensePlate,
                    barcode,
                    brand: brand.split(' ')[0],
                    model: brand,
                    year: 2022 + (i % 3),
                    weightCategory: weightObj.category,
                    maxPayloadTon: weightObj.payload,
                    depot: depot._id,
                    driver: assignedDriver._id,
                    currentDriver: assignedDriver._id,
                    status: (i % 5 === 0) ? VEHICLE_STATUS.OPERATING : (i % 7 === 0 ? VEHICLE_STATUS.MAINTENANCE : VEHICLE_STATUS.READY),
                    odometer: 15000 + (truckCount * 320),
                    fuelLevel: 85 + (i % 15),
                    fuelLiters: 85 + (i % 15)
                });

                createdVehicles.push(vehicle);
                truckCount++;
            }
        }
        console.log(`🚛 Created ${createdVehicles.length} Trucks with Barcodes & assigned drivers spread across 5 Depots.`);

        // 5. Create Real Trips for ALL 25 Drivers
        const customersList = [
            { name: "Công ty Lương thực FUTA Agrico", phone: "0908111222" },
            { name: "Tập đoàn Điện tử Samsung Vina", phone: "0918222333" },
            { name: "Tổng kho Bưu chính Express TP.HCM", phone: "0938333444" },
            { name: "Chuỗi Siêu thị Bách Hóa Xanh", phone: "0948444555" },
            { name: "Công ty Dược phẩm Hậu Giang", phone: "0958555666" },
            { name: "Cảng Container Tiên Sa Đà Nẵng", phone: "0968666777" },
            { name: "KCN Đình Vũ Hải Phòng Freight", phone: "0978777888" },
            { name: "Công ty Nông sản Cần Thơ", phone: "0988888999" }
        ];

        const cargoTypes = [
            "Hàng bưu chính Express & Tiêu dùng",
            "Linh kiện điện tử & Máy móc nhẹ",
            "Nông sản & Thực phẩm đông lạnh",
            "Vận chuyển Container & Hàng nặng",
            "Dược phẩm & Vật tư y tế"
        ];

        let createdTripsCount = 0;
        const createdTripsList = [];

        for (let i = 0; i < createdDrivers.length; i++) {
            const driver = createdDrivers[i];
            const assignedVehicle = createdVehicles.find(v => String(v.currentDriver) === String(driver._id)) || createdVehicles[i % createdVehicles.length];
            const cust = customersList[i % customersList.length];
            const cargo = cargoTypes[i % cargoTypes.length];
            const startDepot = createdDepots[i % createdDepots.length];
            const endDepot = createdDepots[(i + 2) % createdDepots.length];

            // Trip 1: Completed trip (to build revenue history)
            const dateStr = new Date(Date.now() - (i + 1) * 86400000).toISOString().slice(0,10).replace(/-/g,'');
            const tripCode1 = `FUTA-${dateStr}-${1000 + i}`;
            const fare1 = 4500000 + (i * 350000);

            const trip1 = await Trip.create({
                tripCode: tripCode1,
                cargoType: cargo,
                cargoWeightTon: 3.5 + (i % 5),
                startDepot: startDepot._id,
                endDepot: endDepot._id,
                startLocation: startDepot.name,
                endLocation: endDepot.name,
                customerName: cust.name,
                customerPhone: cust.phone,
                fare: fare1,
                distance: 120 + (i * 25),
                dispatcher: dispatcher._id,
                driver: driver._id,
                vehicle: assignedVehicle._id,
                startTime: new Date(Date.now() - (i + 2) * 86400000),
                endTime: new Date(Date.now() - (i + 1) * 86400000),
                startOdometer: assignedVehicle.odometer - 200,
                endOdometer: assignedVehicle.odometer,
                status: 'completed',
                notes: 'Giao hàng đúng giờ, hàng hóa nguyên vẹn'
            });
            createdTripsCount++;
            createdTripsList.push(trip1);

            // Trip 2: Active or Pending Trip for recent operations
            if (i % 2 === 0) {
                const tripCode2 = `FUTA-ACTIVE-${2000 + i}`;
                const trip2 = await Trip.create({
                    tripCode: tripCode2,
                    cargoType: cargoTypes[(i + 1) % cargoTypes.length],
                    cargoWeightTon: 4.0 + (i % 6),
                    startDepot: startDepot._id,
                    endDepot: endDepot._id,
                    startLocation: startDepot.name,
                    endLocation: endDepot.name,
                    customerName: cust.name,
                    customerPhone: cust.phone,
                    fare: fare1 + 1200000,
                    distance: 180 + (i * 15),
                    dispatcher: dispatcher._id,
                    driver: driver._id,
                    vehicle: assignedVehicle._id,
                    startTime: new Date(),
                    status: 'Đang vận hành',
                    notes: 'Chuyến xe đang lưu thông trên hành trình'
                });
                createdTripsCount++;
                createdTripsList.push(trip2);
            }
        }
        console.log(`📦 Created ${createdTripsCount} Real Trips for all 25 drivers.`);

        // 6. Create Check-out Handovers
        for (let i = 0; i < 10; i++) {
            const driver = createdDrivers[i];
            const vehicle = createdVehicles[i];
            const trip = createdTripsList[i % createdTripsList.length];
            await Handover.create({
                type: 'CHECK_OUT',
                trip: trip._id,
                vehicle: vehicle._id,
                driver: driver._id,
                depot: vehicle.depot,
                barcode: vehicle.barcode,
                odometerReading: vehicle.odometer,
                fuelLevelPercent: 90,
                photos: {
                    cabin: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
                    cargoBox: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
                    tires: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80'
                },
                generalNotes: `Đã bàn giao xe ${vehicle.licensePlate} cho tài xế ${driver.fullName}`,
                isCompleted: true
            });
        }

        // 7. Create Sample Roadside Expense Claims for drivers
        for (let i = 0; i < 8; i++) {
            const driver = createdDrivers[i];
            const vehicle = createdVehicles[i];
            const trip = createdTripsList[i % createdTripsList.length];
            await Expense.create({
                trip: trip._id,
                vehicle: vehicle._id,
                driver: driver._id,
                type: EXPENSE_TYPE.TOLL_BOT,
                amount: 150000 + (i * 30000),
                description: `Trạm thu phí BOT cho xe ${vehicle.licensePlate}`,
                receiptImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
                status: i % 2 === 0 ? TRANSACTION_STATUS.APPROVED : TRANSACTION_STATUS.PENDING,
                approvedBy: i % 2 === 0 ? accountant._id : null
            });
        }

        console.log('✅ Seeding completed successfully for all 25 drivers!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedFutaData();


