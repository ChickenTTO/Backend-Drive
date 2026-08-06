const Depot = require('../models/Depot');
const Vehicle = require('../models/Vehicle');
const { VEHICLE_STATUS, WEIGHT_CATEGORY } = require('../utils/constants');

// @desc    Get all 05 Depots with real-time fleet statistics
// @route   GET /api/depots
// @access  Public / Auth
exports.getAllDepots = async (req, res, next) => {
    try {
        const depots = await Depot.find().sort({ code: 1 });
        
        // Enhance depots with live counts
        const depotStats = await Promise.all(depots.map(async (depot) => {
            const vehicles = await Vehicle.find({ depot: depot._id });
            const totalVehicles = vehicles.length;
            const readyVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.READY).length;
            const operatingVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.OPERATING).length;
            const maintenanceVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.MAINTENANCE).length;

            const lightTrucks = vehicles.filter(v => v.weightCategory === WEIGHT_CATEGORY.LIGHT).length;
            const mediumTrucks = vehicles.filter(v => v.weightCategory === WEIGHT_CATEGORY.MEDIUM).length;
            const heavyTrucks = vehicles.filter(v => v.weightCategory === WEIGHT_CATEGORY.HEAVY).length;

            return {
                ...depot.toObject(),
                stats: {
                    totalVehicles,
                    readyVehicles,
                    operatingVehicles,
                    maintenanceVehicles,
                    byWeight: {
                        light: lightTrucks,
                        medium: mediumTrucks,
                        heavy: heavyTrucks
                    }
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: depotStats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single Depot detail with vehicles
// @route   GET /api/depots/:id
// @access  Public / Auth
exports.getDepotById = async (req, res, next) => {
    try {
        const depot = await Depot.findById(req.params.id);
        if (!depot) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bãi xe' });
        }

        const vehicles = await Vehicle.find({ depot: depot._id }).populate('currentDriver', 'fullName phone');

        res.status(200).json({
            success: true,
            data: {
                depot,
                vehicles
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new Depot
// @route   POST /api/depots
// @access  Private (Admin / Dispatcher)
exports.createDepot = async (req, res, next) => {
    try {
        const { code, name, city, address, area, totalCapacity } = req.body;

        if (!code || !name || !city || !address) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin bãi xe (Mã, Tên, Thành phố, Địa chỉ)' });
        }

        const existingDepot = await Depot.findOne({ code: code.toUpperCase().trim() });
        if (existingDepot) {
            return res.status(400).json({ success: false, message: `Mã bãi xe "${code}" đã tồn tại trên hệ thống!` });
        }

        const depot = await Depot.create({
            code: code.toUpperCase().trim(),
            name: name.trim(),
            city: city.trim(),
            address: address.trim(),
            area: Number(area) || 10000,
            totalCapacity: Number(totalCapacity) || 20
        });

        res.status(201).json({
            success: true,
            message: 'Đã khởi tạo Bãi xe mới thành công!',
            data: depot
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update Depot
// @route   PUT /api/depots/:id
// @access  Private (Admin / Dispatcher)
exports.updateDepot = async (req, res, next) => {
    try {
        const { code, name, city, address, area, totalCapacity } = req.body;

        let depot = await Depot.findById(req.params.id);
        if (!depot) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bãi xe cần cập nhật' });
        }

        if (code && code.toUpperCase().trim() !== depot.code) {
            const existingCode = await Depot.findOne({ code: code.toUpperCase().trim(), _id: { $ne: depot._id } });
            if (existingCode) {
                return res.status(400).json({ success: false, message: `Mã bãi xe "${code}" đã bị trùng với bãi xe khác!` });
            }
            depot.code = code.toUpperCase().trim();
        }

        if (name) depot.name = name.trim();
        if (city) depot.city = city.trim();
        if (address) depot.address = address.trim();
        if (area !== undefined) depot.area = Number(area);
        if (totalCapacity !== undefined) depot.totalCapacity = Number(totalCapacity);

        await depot.save();

        res.status(200).json({
            success: true,
            message: 'Đã cập nhật thông tin Bãi xe thành công!',
            data: depot
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete Depot
// @route   DELETE /api/depots/:id
// @access  Private (Admin)
exports.deleteDepot = async (req, res, next) => {
    try {
        const depot = await Depot.findById(req.params.id);
        if (!depot) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bãi xe cần xóa' });
        }

        // Check if vehicles are assigned to this depot
        const vehicleCount = await Vehicle.countDocuments({ depot: depot._id });
        if (vehicleCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa Bãi xe "${depot.name}" vì hiện đang chứa ${vehicleCount} phương tiện tải trọng. Vui lòng điều chuyển xe trước!`
            });
        }

        await depot.deleteOne();

        res.status(200).json({
            success: true,
            message: `Đã xóa Bãi xe "${depot.name}" khỏi hệ thống.`
        });
    } catch (error) {
        next(error);
    }
};
