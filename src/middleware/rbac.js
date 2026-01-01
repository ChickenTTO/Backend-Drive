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
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò ${req.user.role} không có quyền truy cập chức năng này`
      });
    }
    
    next();
  };
};

// Các quyền cụ thể cho từng module
const permissions = {
  // Admin: Toàn quyền
  admin: {
    canAccessAll: true
  },
  
  // Dispatcher: Vận hành chuyến đi, quản lý tài xế/xe
  dispatcher: {
    trips: ['create', 'read', 'update', 'assign'],
    vehicles: ['read', 'update'],
    drivers: ['read', 'update'],
    customers: ['create', 'read', 'update'],
    handover: ['read', 'approve'],
    expenses: ['create', 'read'],
    reports: ['vehicles', 'trips', 'drivers'] // Không có báo cáo doanh thu tổng
  },
  
  // Driver: Giao nhận xe, báo cáo trạng thái, nộp tiền
  driver: {
    trips: ['read', 'updateStatus'], // Chỉ cập nhật trạng thái chuyến của mình
    handover: ['create', 'read'], // Tạo checklist giao nhận
    transactions: ['create', 'read'], // Nộp tiền
    profile: ['read', 'update']
  },
  
  // Accountant: Xác nhận tiền, quản lý chi phí
  accountant: {
    transactions: ['read', 'confirm', 'reject'],
    expenses: ['read', 'approve', 'reject'],
    reports: ['financial', 'revenue', 'expenses']
  }
};

// Check quyền cụ thể
const can = (action, resource) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Admin có toàn quyền
    if (userRole === USER_ROLES.ADMIN) {
      return next();
    }
    
    // Kiểm tra quyền của vai trò
    const rolePermissions = permissions[userRole];
    
    if (!rolePermissions || !rolePermissions[resource]) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này'
      });
    }
    
    if (!rolePermissions[resource].includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền ${action} trên ${resource}`
      });
    }
    
    next();
  };
};

module.exports = {
  authorize,
  can,
  permissions
};