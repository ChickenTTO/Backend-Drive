// @desc    Tạo xe mới
// @route   POST /api/vehicles
// @access  Private (Admin)
exports.createVehicle = async (req, res, next) => {
  try {
    const { licensePlate, brand, model, year, seats, color, status } = req.body;

    // Check required fields
    if (!licensePlate || !brand || !model || !year || !seats) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trường bắt buộc: licensePlate, brand, model, year, seats'
      });
    }

    const vehicle = await Vehicle.create({ licensePlate, brand, model, year, seats, color, status });

    res.status(201).json({
      success: true,
      message: 'Tạo xe thành công',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) { // duplicate key
      return res.status(400).json({ success: false, message: 'Biển số xe đã tồn tại' });
    }
    next(error);
  }
};

// @desc    Cập nhật thông tin xe
// @route   PUT /api/vehicles/:id
// @access  Private (Admin, Dispatcher)
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
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Biển số xe đã tồn tại' });
    }
    next(error);
  }
};
