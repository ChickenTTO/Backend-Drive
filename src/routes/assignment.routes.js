const express = require("express");
const fs = require("fs");
const path = require("path");

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

// GET tất cả
router.get("/", (req, res) => {
  const assignments = readData();
  res.json(assignments);
});

// POST tạo mới
router.post("/", (req, res) => {
  const assignments = readData();
  const newAssignment = { ...req.body };
  assignments.push(newAssignment);
  writeData(assignments);
  res.json(newAssignment);
});

// PUT chỉnh sửa
router.put("/:id", (req, res) => {
  const assignments = readData();
  const idx = assignments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  assignments[idx] = { ...assignments[idx], ...req.body };
  writeData(assignments);
  res.json(assignments[idx]);
});

// DELETE
router.delete("/:id", (req, res) => {
  let assignments = readData();
  assignments = assignments.filter((a) => a.id !== req.params.id);
  writeData(assignments);
  res.json({ success: true });
});

module.exports = router;
