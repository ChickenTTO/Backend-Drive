const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const adminController = require('../controllers/admin.controller');

// Admin-only endpoints
router.use(protect);
router.use(authorize('admin'));

router.post('/reactivate-all', adminController.reactivateAll);
router.post('/reactivate/:idOrUsername', adminController.reactivateUser);

module.exports = router;
