const express = require('express');
const router = express.Router();
const { scanBarcode } = require('../controllers/barcode.controller');
const { protect } = require('../middleware/auth');

router.post('/scan', protect, scanBarcode);

module.exports = router;
