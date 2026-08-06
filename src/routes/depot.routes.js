const express = require('express');
const router = express.Router();
const { getAllDepots, getDepotById, createDepot, updateDepot, deleteDepot } = require('../controllers/depot.controller');
const { protect } = require('../middleware/auth');

router.get('/', getAllDepots);
router.get('/:id', getDepotById);
router.post('/', createDepot);
router.put('/:id', updateDepot);
router.delete('/:id', deleteDepot);

module.exports = router;
