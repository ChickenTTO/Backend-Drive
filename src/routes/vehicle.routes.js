const express = require('express');
const router = express.Router();
const { getAllVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicle.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', protect, authorize('admin'), createVehicle);
router.put('/:id', protect, authorize('admin', 'dispatcher'), updateVehicle);
router.delete('/:id', protect, authorize('admin'), deleteVehicle);

module.exports = router;