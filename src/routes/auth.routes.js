const express = require('express');
const router = express.Router();
// Import chính xác tên hàm từ controller
const { login, register, profile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Định nghĩa các route
router.post('/login', login);       // POST /api/auth/login
router.post('/register', register); // POST /api/auth/register
router.get('/profile', protect, profile); // GET /api/auth/profile (protected)

module.exports = router;