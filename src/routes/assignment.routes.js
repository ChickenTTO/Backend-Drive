const express = require("express");
const fs = require("fs");
const path = require("path");
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();
const dataFile = path.join(__dirname, "../data/assignments.json");

// Helper đọc JSON
const readData = () => {
  try {
    const raw = fs.readFileSync(dataFile);
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

// Helper ghi JSON
const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// Tất cả route cần đăng nhập
router.use(protect);

// GET tất cả (Admin, Dispatcher)
router.get(
  "/",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  (req, res) => {
    const assignments = readData();
    res.json(assignments);
  }
);

// POST tạo mới (Admin, Dispatcher)
router.post(
  "/",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  (req, res) => {
    const assignments = readData();
    const newAssignment = { ...req.body };
    assignments.push(newAssignment);
    writeData(assignments);
    res.json(newAssignment);
  }
);

// PUT chỉnh sửa (Admin, Dispatcher)
router.put(
  "/:id",
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  (req, res) => {
    const assignments = readData();
    const idx = assignments.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    assignments[idx] = { ...assignments[idx], ...req.body };
    writeData(assignments);
    res.json(assignments[idx]);
  }
);

// DELETE (Admin only)
router.delete(
  "/:id",
  authorize(USER_ROLES.ADMIN),
  (req, res) => {
    let assignments = readData();
    assignments = assignments.filter((a) => a.id !== req.params.id);
    writeData(assignments);
    res.json({ success: true });
  }
);

module.exports = router;
