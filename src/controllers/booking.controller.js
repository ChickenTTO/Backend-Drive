const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /bookings
exports.getAll = async (req, res, next) => {
  try {
    const trips = await Trip.find({})
      .populate('vehicle', 'licensePlate barcode brand model')
      .populate('driver', 'fullName phone')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: trips });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to get trips', error: error.message });
  }
};

// GET /bookings/:id
exports.getById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle', 'licensePlate barcode brand model')
      .populate('driver', 'fullName phone')
      .lean();
    if (!trip) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to get booking', error: error.message });
  }
};

// POST /bookings
exports.create = async (req, res, next) => {
  try {
    if (req.body.fare !== undefined) req.body.finalPrice = req.body.fare;
    if (req.body.endTime !== undefined) req.body.completedTime = req.body.endTime;
    
    if (!req.body.tripCode) {
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      req.body.tripCode = `FUTA-${dateStr}-${randomNum}`;
    }

    const trip = await Trip.create(req.body);
    return res.status(201).json({ success: true, data: trip, message: 'Tạo chuyến xe thành công' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo chuyến xe', error: error.message });
  }
};

// PUT /bookings/:id
exports.update = async (req, res, next) => {
  try {
    if (req.body.fare !== undefined) req.body.finalPrice = req.body.fare;
    if (req.body.endTime !== undefined) req.body.completedTime = req.body.endTime;
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: trip, message: 'Booking updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update booking', error: error.message });
  }
};

// PUT /bookings/:id/assign
exports.assignDriver = async (req, res, next) => {
  try {
    const { vehicleId, vehicle, driverId, driver } = req.body;
    const inputVehicle = vehicleId || vehicle;
    const inputDriver = driverId || driver;

    let targetVehicle = null;
    if (inputVehicle) {
      const queryArr = [{ licensePlate: inputVehicle }, { barcode: inputVehicle }];
      if (mongoose.Types.ObjectId.isValid(inputVehicle)) {
        queryArr.push({ _id: inputVehicle });
      }
      targetVehicle = await Vehicle.findOne({ $or: queryArr });
    }

    let targetDriver = null;
    if (inputDriver) {
      const drvQuery = [{ phone: inputDriver }, { username: inputDriver }];
      if (mongoose.Types.ObjectId.isValid(inputDriver)) {
        drvQuery.push({ _id: inputDriver });
      }
      targetDriver = await User.findOne({ $or: drvQuery });
    }

    const updateFields = {
      status: 'Đang vận hành'
    };

    if (targetVehicle) updateFields.vehicle = targetVehicle._id;
    if (targetDriver) updateFields.driver = targetDriver._id;

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('vehicle', 'licensePlate barcode brand model')
      .populate('driver', 'fullName phone');

    if (!updatedTrip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe' });
    }

    // Update vehicle status to Đang vận hành if assigned
    if (targetVehicle) {
      await Vehicle.findByIdAndUpdate(targetVehicle._id, { status: 'Đang vận hành' });
    }

    return res.status(200).json({
      success: true,
      message: 'Gán xe thành công',
      data: updatedTrip
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Lỗi gán xe', error: error.message });
  }
};

// PUT /bookings/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const trip = await Trip.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};
