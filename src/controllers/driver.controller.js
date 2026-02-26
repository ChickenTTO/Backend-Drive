const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const { USER_ROLES } = require("../utils/constants");

// --- Lấy danh sách tài xế ---
exports.getDrivers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = { role: USER_ROLES.DRIVER };

    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);

    const drivers = await User.find(query)
      .select("-password")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    // Gắn xe hiện tại
    const driversWithVehicle = await Promise.all(
      drivers.map(async (driver) => {
        const vehicle = await Vehicle.findOne({
          currentDriver: driver._id,
        }).select("licensePlate brand model");
        return {
          ...driver.toObject(),
          currentVehicle: vehicle,
        };
      }),
    );

    res.json({
      success: true,
      data: driversWithVehicle,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Tạo mới tài xế ---
exports.createDriver = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      username,
      password,
      email,
      address,
      driverLicense,
      licenseExpiry,
    } = req.body;

    const driver = await User.create({
      fullName,
      phone,
      username: username || phone, // tự gán username = phone nếu FE không gửi
      password: password || "123456",
      email,
      address,
      role: USER_ROLES.DRIVER,
      driverLicense,
      licenseExpiry,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Thêm tài xế thành công",
      data: {
        _id: driver._id,
        fullName: driver.fullName,
        phone: driver.phone,
        email: driver.email,
        role: driver.role,
        username: driver.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Lấy chi tiết tài xế ---
exports.getDriverById = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi ID undefined
    if (!req.params.id || req.params.id === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "ID tài xế không hợp lệ" });
    }

    const driver = await User.findOne({
      _id: req.params.id,
      role: USER_ROLES.DRIVER,
    }).select("-password");

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài xế" });
    }

    const currentVehicle = await Vehicle.findOne({
      currentDriver: driver._id,
    }).select("licensePlate brand model status");

    const stats = await Trip.aggregate([
      { $match: { driver: driver._id, status: "completed" } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalRevenue: { $sum: "$finalPrice" },
          totalDistance: { $sum: "$distance" },
          avgRating: { $avg: "$rating.score" },
        },
      },
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
          avgRating: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Cập nhật tài xế ---
exports.updateDriver = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi ID undefined
    if (!req.params.id || req.params.id === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "ID tài xế không hợp lệ" });
    }

    const allowedUpdates = [
      "fullName",
      "phone",
      "email",
      "driverLicense",
      "licenseExpiry",
      "address",
      "emergencyContact",
      "salary",
      "commissionRate",
      "isActive",
    ];

    const updates = {};
    allowedUpdates.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // luôn gán username = phone nếu chưa có
    if (req.body.phone && !req.body.username) updates.username = req.body.phone;

    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: USER_ROLES.DRIVER },
      updates,
      { new: true, runValidators: true },
    ).select("-password");

    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài xế" });

    res.json({
      success: true,
      message: "Cập nhật thông tin tài xế thành công",
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// --- Lấy lịch sử chuyến đi ---
exports.getDriverTrips = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi ID undefined
    if (!req.params.id || req.params.id === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "ID tài xế không hợp lệ" });
    }

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
      .populate("customer", "phone name")
      .populate("vehicle", "licensePlate")
      .sort("-scheduledTime")
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: trips,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Xóa tài xế vĩnh viễn (Hard Delete) ---
// Thay thế cho hàm deactivateDriver cũ để giải quyết lỗi "xóa xong vẫn hiện"
exports.deleteDriver = async (req, res, next) => {
  try {
    // CHỐNG SẬP SERVER: Bắt lỗi ID undefined
    if (!req.params.id || req.params.id === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "ID tài xế không hợp lệ để xóa" });
    }

    const driver = await User.findOne({
      _id: req.params.id,
      role: USER_ROLES.DRIVER,
    });

    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài xế" });

    // Kiểm tra xem tài xế có đang dở cuốc xe nào không
    const activeTrips = await Trip.countDocuments({
      driver: driver._id,
      status: { $in: ["assigned", "called", "picked_up"] },
    });
    if (activeTrips > 0)
      return res
        .status(400)
        .json({
          success: false,
          message: "Tài xế đang có chuyến đi đang thực hiện, không thể xóa",
        });

    // SỬA LỖI: Xóa Vĩnh Viễn thay vì chỉ vô hiệu hóa
    await User.findByIdAndDelete(driver._id);

    // Gỡ tài xế khỏi xe đang lái (để xe đó thành xe trống)
    await Vehicle.updateMany(
      { currentDriver: driver._id },
      { currentDriver: null },
    );

    res.json({
      success: true,
      message: "Đã xóa tài xế vĩnh viễn khỏi hệ thống",
    });
  } catch (error) {
    next(error);
  }
};
