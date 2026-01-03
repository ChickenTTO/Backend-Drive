const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

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

// GET tất cả trips
router.get('/', (req, res) => {
  const trips = readTrips();
  res.json(trips);
});

// POST tạo trip mới
router.post('/', (req, res) => {
  const trips = readTrips();
  const newTrip = { id: `t${Date.now()}`, ...req.body };
  trips.push(newTrip);
  writeTrips(trips);
  res.status(201).json(newTrip);
});

// PUT cập nhật trip
router.put('/:id', (req, res) => {
  const trips = readTrips();
  const index = trips.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trip không tồn tại' });

  trips[index] = { ...trips[index], ...req.body };
  writeTrips(trips);
  res.json(trips[index]);
});

// DELETE trip
router.delete('/:id', (req, res) => {
  let trips = readTrips();
  const exists = trips.some((t) => t.id === req.params.id);
  if (!exists) return res.status(404).json({ message: 'Trip không tồn tại' });

  trips = trips.filter((t) => t.id !== req.params.id);
  writeTrips(trips);
  res.json({ message: 'Xóa thành công' });
});

module.exports = router;
