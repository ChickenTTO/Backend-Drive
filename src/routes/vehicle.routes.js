const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  addMaintenance,
  getMaintenanceHistory,
  getVehicleRevenue,
  deleteVehicle
} = require('../controllers/vehicle.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { USER_ROLES } = require('../utils/constants');

router.use(protect);

// Routes cho tất cả user
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.get('/:id/maintenance', getMaintenanceHistory);
router.get('/:id/revenue', getVehicleRevenue);

// Admin và Dispatcher
router.post(
  '/',
  authorize(USER_ROLES.ADMIN),
  createVehicle
);

router.put(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  updateVehicle
);

router.post(
  '/:id/maintenance',
  authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER),
  addMaintenance
);

// Admin only
router.delete('/:id', authorize(USER_ROLES.ADMIN), deleteVehicle);

module.exports = router;