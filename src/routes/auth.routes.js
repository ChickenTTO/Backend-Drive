const express = require('express');
const router = express.Router();
// Import chính xác tên hàm từ controller
const { login, register } = require('../controllers/auth.controller');

// Định nghĩa các route
router.post('/login', login);       // POST /api/auth/login
router.post('/register', register); // POST /api/auth/register

module.exports = router;