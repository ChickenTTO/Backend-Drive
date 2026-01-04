const Trip = require('../models/Trip');

// GET /bookings
exports.getAll = async (req, res, next) => {
  try {
    const trips = await Trip.find({}).lean();
    return res.status(200).json({ success: true, data: trips }); // data thay vì items
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to get trips', error: error.message });
  }
};

// GET /bookings/:id
exports.getById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id).lean();
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
    const trip = await Trip.create(req.body);
    return res.status(201).json({ success: true, data: trip, message: 'Booking created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to create booking', error: error.message });
  }
};

// PUT /bookings/:id
exports.update = async (req, res, next) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: trip, message: 'Booking updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update booking', error: error.message });
  }
};
