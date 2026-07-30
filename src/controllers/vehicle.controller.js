const Vehicle = require('../models/Vehicle');
const Depot = require('../models/Depot');
const { VEHICLE_STATUS, WEIGHT_CATEGORY } = require('../utils/constants');

// @desc    Get all vehicles with filtering by depot, status, weight category
// @route   GET /api/vehicles
// @access  Public / Auth
exports.getAllVehicles = async (req, res, next) => {
    try {
        const { depotId, status, weightCategory, search } = req.query;
        let filter = {};

        if (depotId) filter.depot = depotId;
        if (status) filter.status = status;
        if (weightCategory) filter.weightCategory = weightCategory;
        if (search) {
            filter.$or = [
                { licensePlate: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }

        const vehicles = await Vehicle.find(filter)
            .populate('depot', 'name code city address')
            .populate('currentDriver', 'fullName phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public / Auth
exports.getVehicleById = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('depot', 'name code city address')
            .populate('currentDriver', 'fullName phone');

        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe tải' });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new truck vehicle (Admin only)
// @route   POST /api/vehicles
// @access  Private/Admin
exports.createVehicle = async (req, res, next) => {
    try {
        const { licensePlate, barcode, brand, model, year, weightCategory, maxPayloadTon, depotId, odometer, fuelLevel } = req.body;

        // Check unique licensePlate or barcode
        const existingPlate = await Vehicle.findOne({ licensePlate: licensePlate.trim() });
        if (existingPlate) {
            return res.status(400).json({ success: false, message: 'Biển số xe đã tồn tại trong hệ thống' });
        }

        const existingBarcode = await Vehicle.findOne({ barcode: barcode.trim().toUpperCase() });
        if (existingBarcode) {
            return res.status(400).json({ success: false, message: 'Mã vạch xe (Barcode) đã bị trùng' });
        }

        const vehicle = await Vehicle.create({
            licensePlate: licensePlate.trim(),
            barcode: barcode.trim().toUpperCase(),
            brand,
            model,
            year: Number(year),
            weightCategory,
            maxPayloadTon: Number(maxPayloadTon),
            depot: depotId,
            odometer: Number(odometer) || 0,
            fuelLevel: Number(fuelLevel) || 100,
            status: VEHICLE_STATUS.READY
        });

        res.status(201).json({
            success: true,
            message: 'Tạo phương tiện xe tải mới thành công',
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
exports.updateVehicle = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe tải' });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin xe tải thành công',
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
exports.deleteVehicle = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe tải' });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa phương tiện xe tải khỏi hệ thống'
        });
    } catch (error) {
        next(error);
    }
};