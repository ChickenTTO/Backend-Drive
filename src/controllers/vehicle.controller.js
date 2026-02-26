const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { VEHICLE_STATUS } = require('../utils/constants');

// @desc    Tạo xe mới
// @route   POST /api/vehicles
// @access  Private (Admin)
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

// @desc    Lấy danh sách xe
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Vehicle.countDocuments(query);

    const vehicles = await Vehicle.find(query)
      .populate('currentDriver', 'fullName phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết xe
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicleById = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi nếu ID không hợp lệ
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

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

// @desc    Cập nhật thông tin xe
// @route   PUT /api/vehicles/:id
// @access  Private (Admin, Dispatcher)
exports.updateVehicle = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi nếu ID không hợp lệ
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

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

// @desc    Thêm lịch sử bảo dưỡng
// @route   POST /api/vehicles/:id/maintenance
// @access  Private (Admin, Dispatcher)
exports.addMaintenance = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi nếu ID không hợp lệ
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

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

// @desc    Lấy lịch sử bảo dưỡng
// @route   GET /api/vehicles/:id/maintenance
// @access  Private
exports.getMaintenanceHistory = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi nếu ID không hợp lệ
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

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

// @desc    Lấy doanh thu của xe
// @route   GET /api/vehicles/:id/revenue
// @access  Private
exports.getVehicleRevenue = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi nếu ID không hợp lệ
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

    const { startDate, endDate } = req.query;

    let dateFilter = { vehicle: req.params.id, status: 'completed' };
    
    if (startDate || endDate) {
      dateFilter.completedTime = {};
      if (startDate) dateFilter.completedTime.$gte = new Date(startDate);
      if (endDate) dateFilter.completedTime.$lte = new Date(endDate);
    }

    const trips = await Trip.find(dateFilter)
      .select('tripCode finalPrice completedTime distance')
      .sort('-completedTime');

    const totalRevenue = trips.reduce((sum, trip) => sum + trip.finalPrice, 0);
    const totalTrips = trips.length;
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

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

// @desc    Xóa xe (soft delete)
// @route   DELETE /api/vehicles/:id
// @access  Private (Admin only)
exports.deleteVehicle = async (req, res, next) => {
  try {
    // 1. Kiểm tra ID hợp lệ (đã thêm ở bước trước)
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID xe không hợp lệ để thực hiện chức năng xóa'
      });
    }

    // 2. SỬA LỖI TẠI ĐÂY: Dùng findByIdAndDelete để xóa THẬT khỏi database
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    // Nếu không tìm thấy xe để xóa
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    // Xóa thành công
    res.json({
      success: true,
      message: 'Đã xóa xe vĩnh viễn khỏi cơ sở dữ liệu'
    });
  } catch (error) {
    next(error);
  }
};