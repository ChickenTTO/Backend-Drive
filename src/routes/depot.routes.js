const express = require('express');
const router = express.Router();
const { getAllDepots, getDepotById } = require('../controllers/depot.controller');
const { protect } = require('../middleware/auth');

router.get('/', getAllDepots);
router.get('/:id', getDepotById);

module.exports = router;
