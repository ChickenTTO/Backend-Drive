const { USER_ROLES } = require('../utils/constants');

// Middleware kiểm tra quyền truy cập dựa trên vai trò
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng'
      });
    }
    
    // Admin luôn có quyền truy cập
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Quyền truy cập bị từ chối cho vai trò: ${req.user.role}`
      });
    }
    
    next();
  };
};

// Các quyền cụ thể cho từng module (dùng constants thay hardcoded strings)
const permissions = {
  // Admin: Toàn quyền
  [USER_ROLES.ADMIN]: {
    canAccessAll: true
  },
  
  // Dispatcher: Vận hành chuyến đi, quản lý tài xế/xe
  [USER_ROLES.DISPATCHER]: {
    trips: ['create', 'read', 'update', 'assign'],
    vehicles: ['read', 'update'],
    drivers: ['read', 'update'],
    customers: ['create', 'read', 'update'],
    handover: ['read', 'approve'],
    expenses: ['create', 'read'],
    reports: ['vehicles', 'trips', 'drivers'] // Không có báo cáo doanh thu tổng
  },
  
  // Driver: Giao nhận xe, báo cáo trạng thái, nộp tiền
  [USER_ROLES.DRIVER]: {
    trips: ['read', 'updateStatus'], // Chỉ cập nhật trạng thái chuyến của mình
    handover: ['create', 'read'], // Tạo checklist giao nhận
    transactions: ['create', 'read'], // Nộp tiền
    profile: ['read', 'update']
  },
  
  // Accountant: Xác nhận tiền, quản lý chi phí
  [USER_ROLES.ACCOUNTANT]: {
    transactions: ['read', 'confirm', 'reject'],
    expenses: ['read', 'approve', 'reject'],
    reports: ['financial', 'revenue', 'expenses']
  }
};

// Check quyền cụ thể
const can = (action, resource) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng'
      });
    }

    const userRole = req.user.role;
    const rolePermissions = permissions[userRole];

    if (!rolePermissions) {
      return res.status(403).json({
        success: false,
        message: 'Quyền truy cập bị từ chối'
      });
    }

    // Admin có toàn quyền
    if (rolePermissions.canAccessAll) {
      return next();
    }

    // Check resource permissions
    const resourcePermissions = rolePermissions[resource];
    if (resourcePermissions && resourcePermissions.includes(action)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối'
    });
  };
};

module.exports = {
  authorize,
  can,
  permissions
};