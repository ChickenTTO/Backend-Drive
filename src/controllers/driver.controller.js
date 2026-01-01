const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { USER_ROLES } = require('../utils/constants');

// @desc    Lấy danh sách tài xế
// @route   GET /api/drivers
// @access  Private (Admin, Dispatcher)
exports.getDrivers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = { role: USER_ROLES.DRIVER };
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);

    const drivers = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Get current vehicle for each driver
    const driversWithVehicle = await Promise.all(
      drivers.map(async (driver) => {
        const vehicle = await Vehicle.findOne({ currentDriver: driver._id })
          .select('licensePlate brand model');
        return {
          ...driver.toObject(),
          currentVehicle: vehicle
        };
      })
    );

    res.json({
      success: true,
      data: driversWithVehicle,
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

// @desc    Lấy chi tiết tài xế
// @route   GET /api/drivers/:id
// @access  Private
exports.getDriverById = async (req, res, next) => {
  try {
    const driver = await User.findOne({ 
      _id: req.params.id, 
      role: USER_ROLES.DRIVER 
    }).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    // Get current vehicle
    const currentVehicle = await Vehicle.findOne({ currentDriver: driver._id })
      .select('licensePlate brand model status');

    // Get statistics
    const stats = await Trip.aggregate([
      { $match: { driver: driver._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' },
          totalDistance: { $sum: '$distance' },
          avgRating: { $avg: '$rating.score' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        ...driver.toObject(),
        currentVehicle,
        statistics: stats[0] || {
          totalTrips: 0,
          totalRevenue: 0,
          totalDistance: 0,
          avgRating: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin tài xế
// @route   PUT /api/drivers/:id
// @access  Private (Admin, Dispatcher)
exports.updateDriver = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'fullName',
      'phone',
      'email',
      'driverLicense',
      'licenseExpiry',
      'address',
      'emergencyContact',
      'salary',
      'commissionRate',
      'isActive'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: USER_ROLES.DRIVER },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin tài xế thành công',
      data: driver
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch sử chuyến đi của tài xế
// @route   GET /api/drivers/:id/trips
// @access  Private
exports.getDriverTrips = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = { driver: req.params.id };
    
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await Trip.countDocuments(query);

    const trips = await Trip.find(query)
      .populate('customer', 'phone name')
      .populate('vehicle', 'licensePlate')
      .sort('-scheduledTime')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: trips,
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

// @desc    Vô hiệu hóa tài xế
// @route   DELETE /api/drivers/:id
// @access  Private (Admin only)
exports.deactivateDriver = async (req, res, next) => {
  try {
    const driver = await User.findOne({ 
      _id: req.params.id, 
      role: USER_ROLES.DRIVER 
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    // Check if driver has active trips
    const activeTrips = await Trip.countDocuments({
      driver: driver._id,
      status: { $in: ['assigned', 'called', 'picked_up'] }
    });

    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tài xế đang có chuyến đi đang thực hiện, không thể vô hiệu hóa'
      });
    }

    driver.isActive = false;
    await driver.save();

    // Remove driver from current vehicle
    await Vehicle.updateMany(
      { currentDriver: driver._id },
      { currentDriver: null }
    );

    res.json({
      success: true,
      message: 'Vô hiệu hóa tài xế thành công'
    });
  } catch (error) {
    next(error);
  }
};