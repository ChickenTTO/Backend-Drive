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
    
    // Tạm thời tắt phân quyền để tránh lỗi 403 theo yêu cầu
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
    // Tạm thời tắt phân quyền để tránh lỗi 403 theo yêu cầu
    next();
  };
};

module.exports = {
  authorize,
  can,
  permissions
};