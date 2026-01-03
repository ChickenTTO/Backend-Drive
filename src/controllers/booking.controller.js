const Trip = require('../models/Trip');

// Minimal bookings controller that maps to Trip model
exports.getAll = async (req, res, next) => {
  try {
    const trips = await Trip.find({}).lean();
    // Normalize payload to expected frontend shape
    return res.status(200).json({ success: true, items: trips });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id).lean();
    if (!trip) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// For now, create/update endpoints can be thin wrappers
exports.create = async (req, res, next) => {
  try {
    const trip = await Trip.create(req.body);
    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};
