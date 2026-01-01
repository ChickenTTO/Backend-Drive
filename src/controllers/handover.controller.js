const Handover = require('../models/Handover');
const Vehicle = require('../models/Vehicle');

// @desc    Tạo checklist giao/nhận xe
// @route   POST /api/handover/check-in hoặc /check-out
// @access  Private (Driver)
exports.createHandover = async (req, res, next) => {
  try {
    const { type, vehicleId, checklist, overallPhotos, generalNotes, issues } = req.body;

    // Kiểm tra xe tồn tại
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    // Tạo handover
    const handover = await Handover.create({
      type,
      vehicle: vehicleId,
      driver: req.user.id,
      confirmedBy: req.user.id, // Tài xế tự xác nhận, admin/dispatcher sẽ duyệt sau
      checklist,
      overallPhotos,
      generalNotes,
      issues: issues || []
    });

    // Cập nhật trạng thái xe
    if (type === 'CHECK_IN') {
      vehicle.currentDriver = req.user.id;
      vehicle.status = 'active';
    } else if (type === 'CHECK_OUT') {
      vehicle.currentDriver = null;
    }
    await vehicle.save();

    await handover.populate([
      { path: 'vehicle', select: 'licensePlate brand model' },
      { path: 'driver', select: 'fullName phone' }
    ]);

    res.status(201).json({
      success: true,
      message: `${type === 'CHECK_IN' ? 'Nhận' : 'Trả'} xe thành công`,
      data: handover
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách handover
// @route   GET /api/handover
// @access  Private
exports.getHandovers = async (req, res, next) => {
  try {
    const { vehicleId, driverId, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (driverId) query.driver = driverId;
    if (type) query.type = type;

    if (startDate || endDate) {
      query.handoverTime = {};
      if (startDate) query.handoverTime.$gte = new Date(startDate);
      if (endDate) query.handoverTime.$lte = new Date(endDate);
    }

    // Driver chỉ xem được handover của mình
    if (req.user.role === 'driver') {
      query.driver = req.user.id;
    }

    const skip = (page - 1) * limit;
    const total = await Handover.countDocuments(query);

    const handovers = await Handover.find(query)
      .populate('vehicle', 'licensePlate brand model')
      .populate('driver', 'fullName phone')
      .populate('confirmedBy', 'fullName')
      .sort('-handoverTime')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: handovers,
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

// @desc    Lấy chi tiết handover
// @route   GET /api/handover/:id
// @access  Private
exports.getHandoverById = async (req, res, next) => {
  try {
    const handover = await Handover.findById(req.params.id)
      .populate('vehicle')
      .populate('driver', '-password')
      .populate('confirmedBy', 'fullName phone');

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giao nhận'
      });
    }

    res.json({
      success: true,
      data: handover
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hoàn thành checklist (khóa chỉnh sửa)
// @route   PATCH /api/handover/:id/complete
// @access  Private (Admin, Dispatcher)
exports.completeHandover = async (req, res, next) => {
  try {
    const handover = await Handover.findById(req.params.id);

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giao nhận'
      });
    }

    if (handover.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Phiếu giao nhận đã được hoàn thành'
      });
    }

    handover.isCompleted = true;
    handover.confirmedBy = req.user.id;
    await handover.save();

    res.json({
      success: true,
      message: 'Xác nhận phiếu giao nhận thành công',
      data: handover
    });
  } catch (error) {
    next(error);
  }
};