const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { VEHICLE_STATUS } = require('../utils/constants');

// =======================
// TẠO XE
// POST /api/vehicles
// =======================
exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Tạo xe thành công',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// LẤY DANH SÁCH XE
// GET /api/vehicles
// =======================
exports.getVehicles = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Vehicle.countDocuments(query);

    const vehicles = await Vehicle.find(query)
      .populate('currentDriver', 'fullName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// CHI TIẾT XE
// GET /api/vehicles/:id
// =======================
exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('currentDriver', 'fullName phone email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// CẬP NHẬT XE
// PUT /api/vehicles/:id
// =======================
exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật xe thành công',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// THÊM BẢO DƯỠNG
// POST /api/vehicles/:id/maintenance
// =======================
exports.addMaintenance = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    vehicle.maintenanceHistory.push(req.body);
    await vehicle.save();

    res.json({
      success: true,
      message: 'Thêm lịch sử bảo dưỡng thành công',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// LẤY LỊCH SỬ BẢO DƯỠNG
// GET /api/vehicles/:id/maintenance
// =======================
exports.getMaintenanceHistory = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    res.json({
      success: true,
      data: vehicle.maintenanceHistory
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// DOANH THU XE
// GET /api/vehicles/:id/revenue
// =======================
exports.getVehicleRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      vehicle: req.params.id,
      status: 'completed'
    };

    if (startDate || endDate) {
      filter.completedTime = {};
      if (startDate) filter.completedTime.$gte = new Date(startDate);
      if (endDate) filter.completedTime.$lte = new Date(endDate);
    }

    const trips = await Trip.find(filter)
      .select('tripCode finalPrice completedTime distance')
      .sort({ completedTime: -1 });

    const totalRevenue = trips.reduce((sum, t) => sum + (t.finalPrice || 0), 0);
    const totalTrips = trips.length;
    const totalDistance = trips.reduce((sum, t) => sum + (t.distance || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTrips,
        totalDistance,
        trips
      }
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// XÓA XE (SOFT DELETE)
// DELETE /api/vehicles/:id
// =======================
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    vehicle.isActive = false;
    vehicle.status = VEHICLE_STATUS.INACTIVE;
    await vehicle.save();

    res.json({
      success: true,
      message: 'Xóa xe thành công'
    });
  } catch (error) {
    next(error);
  }
};
