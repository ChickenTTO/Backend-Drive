const Trip = require('../models/Trip');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { TRIP_STATUS, USER_ROLES } = require('../utils/constants');

// @desc    Tạo chuyến đi mới
// @route   POST /api/trips
// @access  Private (Admin, Dispatcher)
exports.createTrip = async (req, res, next) => {
  try {
    const {
      customerPhone,
      customerName,
      pickupLocation,
      dropoffLocation,
      scheduledTime,
      estimatedPrice,
      passengers,
      customerNote,
      vehicleId,
      driverId
    } = req.body;

    // Kiểm tra hoặc tạo khách hàng mới
    let customer = await Customer.findOne({ phone: customerPhone });
    
    if (!customer) {
      customer = await Customer.create({
        phone: customerPhone,
        name: customerName || 'Khách hàng mới'
      });
    } else if (customerName && customer.name !== customerName) {
      customer.name = customerName;
      await customer.save();
    }

    // Tạo dữ liệu chuyến đi
    const tripData = {
      customer: customer._id,
      customerPhone,
      customerName: customer.name,
      pickupLocation,
      dropoffLocation,
      scheduledTime,
      estimatedPrice,
      passengers,
      customerNote,
      dispatcher: req.user.id,
      status: TRIP_STATUS.NEW
    };

    // Nếu gán trực tiếp xe và tài xế
    if (vehicleId && driverId) {
      // Kiểm tra xe có tồn tại và đang hoạt động
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || vehicle.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Xe không tồn tại hoặc không hoạt động'
        });
      }

      // Kiểm tra tài xế
      const driver = await User.findById(driverId);
      if (!driver || driver.role !== USER_ROLES.DRIVER || !driver.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Tài xế không hợp lệ'
        });
      }

      tripData.vehicle = vehicleId;
      tripData.driver = driverId;
      tripData.status = TRIP_STATUS.ASSIGNED;
      
      // Thêm vào lịch sử trạng thái
      tripData.statusHistory = [{
        status: TRIP_STATUS.ASSIGNED,
        timestamp: new Date(),
        updatedBy: req.user.id,
        note: 'Gán trực tiếp khi tạo chuyến'
      }];
    }

    // Tạo chuyến đi
    const trip = await Trip.create(tripData);

    // Cập nhật thống kê khách hàng
    customer.trips.push(trip._id);
    customer.totalTrips += 1;
    await customer.save();

    // Populate thông tin
    await trip.populate([
      { path: 'customer', select: 'phone name' },
      { path: 'vehicle', select: 'licensePlate brand model' },
      { path: 'driver', select: 'fullName phone' },
      { path: 'dispatcher', select: 'fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo chuyến đi thành công',
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách chuyến đi (có filter, phân trang)
// @route   GET /api/trips
// @access  Private
exports.getTrips = async (req, res, next) => {
  try {
    const {
      status,
      driverId,
      vehicleId,
      customerPhone,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = '-createdAt'
    } = req.query;

    // Build query
    let query = {};

    // Nếu là tài xế, chỉ xem chuyến của mình
    if (req.user.role === USER_ROLES.DRIVER) {
      query.driver = req.user.id;
    }

    if (status) query.status = status;
    if (driverId) query.driver = driverId;
    if (vehicleId) query.vehicle = vehicleId;
    if (customerPhone) query.customerPhone = customerPhone;
    
    // Lọc theo ngày
    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    // Phân trang
    const skip = (page - 1) * limit;
    const total = await Trip.countDocuments(query);

    const trips = await Trip.find(query)
      .populate('customer', 'phone name')
      .populate('vehicle', 'licensePlate brand model')
      .populate('driver', 'fullName phone')
      .populate('dispatcher', 'fullName')
      .sort(sortBy)
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

// @desc    Lấy chi tiết một chuyến đi
// @route   GET /api/trips/:id
// @access  Private
exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('customer')
      .populate('vehicle')
      .populate('driver', '-password')
      .populate('dispatcher', 'fullName phone')
      .populate('statusHistory.updatedBy', 'fullName')
      .populate('internalNotes.createdBy', 'fullName');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi'
      });
    }

    // Kiểm tra quyền: Driver chỉ xem được chuyến của mình
    if (req.user.role === USER_ROLES.DRIVER && 
        trip.driver._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem chuyến đi này'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gán xe và tài xế cho chuyến đi
// @route   PATCH /api/trips/:id/assign
// @access  Private (Admin, Dispatcher)
exports.assignTrip = async (req, res, next) => {
  try {
    const { vehicleId, driverId } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi'
      });
    }

    if (trip.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Chuyến đi đã hoàn thành, không thể chỉnh sửa'
      });
    }

    // Kiểm tra xe
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Xe không hợp lệ hoặc không hoạt động'
      });
    }

    // Kiểm tra tài xế
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== USER_ROLES.DRIVER || !driver.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tài xế không hợp lệ'
      });
    }

    // Cập nhật
    trip.vehicle = vehicleId;
    trip.driver = driverId;
    await trip.updateStatus(TRIP_STATUS.ASSIGNED, req.user.id, 'Gán xe và tài xế');

    await trip.populate([
      { path: 'vehicle', select: 'licensePlate brand model' },
      { path: 'driver', select: 'fullName phone' }
    ]);

    res.json({
      success: true,
      message: 'Gán chuyến đi thành công',
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật trạng thái chuyến đi
// @route   PATCH /api/trips/:id/status
// @access  Private (Driver, Dispatcher, Admin)
exports.updateTripStatus = async (req, res, next) => {
  try {
    const { status, note, actualPrice, distance } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi'
      });
    }

    // Driver chỉ cập nhật được chuyến của mình
    if (req.user.role === USER_ROLES.DRIVER && 
        trip.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật chuyến đi này'
      });
    }

    // Validate chuyển trạng thái
    const validTransitions = {
      [TRIP_STATUS.NEW]: [TRIP_STATUS.ASSIGNED, TRIP_STATUS.CANCELLED],
      [TRIP_STATUS.ASSIGNED]: [TRIP_STATUS.CALLED, TRIP_STATUS.CANCELLED],
      [TRIP_STATUS.CALLED]: [TRIP_STATUS.PICKED_UP, TRIP_STATUS.INCIDENT, TRIP_STATUS.CANCELLED],
      [TRIP_STATUS.PICKED_UP]: [TRIP_STATUS.COMPLETED, TRIP_STATUS.INCIDENT],
      [TRIP_STATUS.INCIDENT]: [TRIP_STATUS.PICKED_UP, TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED]
    };

    if (!validTransitions[trip.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái ${trip.status} sang ${status}`
      });
    }

    // Nếu hoàn thành, cần có giá thực tế
    if (status === TRIP_STATUS.COMPLETED) {
      if (!actualPrice) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập giá thực tế của chuyến đi'
        });
      }
      
      trip.actualPrice = actualPrice;
      trip.finalPrice = actualPrice - (trip.discount || 0);
      trip.distance = distance || 0;
      
      // Cộng doanh thu cho xe
      if (trip.vehicle) {
        await Vehicle.findByIdAndUpdate(trip.vehicle, {
          $inc: { totalRevenue: trip.finalPrice }
        });
      }
      
      // Tính hoa hồng cho dispatcher
      const dispatcher = await User.findById(trip.dispatcher);
      if (dispatcher && dispatcher.commissionRate > 0) {
        trip.commissionAmount = (trip.finalPrice * dispatcher.commissionRate) / 100;
      }
      
      // Cập nhật thống kê khách hàng
      await Customer.findByIdAndUpdate(trip.customer, {
        $inc: { totalSpent: trip.finalPrice }
      });
    }

    // Cập nhật trạng thái
    await trip.updateStatus(status, req.user.id, note);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm ghi chú cho chuyến đi
// @route   POST /api/trips/:id/note
// @access  Private
exports.addNote = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung ghi chú không được để trống'
      });
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi'
      });
    }

    await trip.addNote(content, req.user.id);

    res.json({
      success: true,
      message: 'Thêm ghi chú thành công',
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin chuyến đi (trước khi hoàn thành)
// @route   PUT /api/trips/:id
// @access  Private (Admin, Dispatcher)
exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi'
      });
    }

    if (trip.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Chuyến đi đã hoàn thành, không thể chỉnh sửa'
      });
    }

    const allowedUpdates = [
      'pickupLocation',
      'dropoffLocation',
      'scheduledTime',
      'estimatedPrice',
      'passengers',
      'customerNote',
      'discount'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    await trip.save();

    res.json({
      success: true,
      message: 'Cập nhật chuyến đi thành công',
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa chuyến đi (soft delete hoặc chỉ cho phép hủy)
// @route   DELETE /api/trips/:id
// @access  Private (Admin only)
exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi'
      });
    }

    if (trip.status === TRIP_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chuyến đi đã hoàn thành'
      });
    }

    // Chuyển sang trạng thái hủy thay vì xóa
    await trip.updateStatus(TRIP_STATUS.CANCELLED, req.user.id, 'Admin hủy chuyến');

    res.json({
      success: true,
      message: 'Hủy chuyến đi thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy các chuyến đang chạy của một xe
// @route   GET /api/trips/vehicle/:vehicleId/active
// @access  Private
exports.getActiveTripsOfVehicle = async (req, res, next) => {
  try {
    const trips = await Trip.find({
      vehicle: req.params.vehicleId,
      status: { $in: [TRIP_STATUS.ASSIGNED, TRIP_STATUS.CALLED, TRIP_STATUS.PICKED_UP] }
    })
      .populate('customer', 'phone name')
      .populate('driver', 'fullName phone')
      .sort('scheduledTime');

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    next(error);
  }
};