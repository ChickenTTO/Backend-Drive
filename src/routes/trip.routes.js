const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

const DATA_PATH = path.join(__dirname, '../data/trips.json');

// Helper: đọc trips từ file
const readTrips = () => {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Helper: ghi trips vào file
const writeTrips = (trips) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(trips, null, 2), 'utf-8');
};

// Tất cả route cần đăng nhập
router.use(protect);

// GET tất cả trips (Admin, Dispatcher, Driver)
router.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.DRIVER),
  (req, res) => {
    const trips = readTrips();
    res.json(trips);
  }
);

// POST tạo trip mới (Admin, Dispatcher)
router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  (req, res) => {
    const trips = readTrips();
    const newTrip = { id: `t${Date.now()}`, ...req.body };
    trips.push(newTrip);
    writeTrips(trips);
    res.status(201).json(newTrip);
  }
);

// PUT cập nhật trip (Admin, Dispatcher)
router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  (req, res) => {
    const trips = readTrips();
    const index = trips.findIndex((t) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Trip không tồn tại' });

    trips[index] = { ...trips[index], ...req.body };
    writeTrips(trips);
    res.json(trips[index]);
  }
);

// DELETE trip (Admin only)
router.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  (req, res) => {
    let trips = readTrips();
    const exists = trips.some((t) => t.id === req.params.id);
    if (!exists) return res.status(404).json({ message: 'Trip không tồn tại' });

    trips = trips.filter((t) => t.id !== req.params.id);
    writeTrips(trips);
    res.json({ message: 'Xóa thành công' });
  }
);

module.exports = router;
