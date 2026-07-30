const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);

module.exports = router;