const express = require('express');
const router = express.Router();
const { createHandover, getHandoversByTrip } = require('../controllers/handover.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createHandover);
router.get('/trip/:tripId', getHandoversByTrip);

module.exports = router;