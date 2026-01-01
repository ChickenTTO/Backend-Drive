// Vai trò người dùng
const USER_ROLES = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  ACCOUNTANT: 'accountant'
};

// Trạng thái chuyến đi
const TRIP_STATUS = {
  NEW: 'new',                    // Mới tạo
  ASSIGNED: 'assigned',          // Đã gán tài xế
  CALLED: 'called',              // Đã gọi hẹn
  PICKED_UP: 'picked_up',        // Đã đón khách
  INCIDENT: 'incident',          // Sự cố
  COMPLETED: 'completed',        // Hoàn thành
  CANCELLED: 'cancelled'         // Hủy
};

// Trạng thái xe
const VEHICLE_STATUS = {
  ACTIVE: 'active',              // Đang hoạt động
  INACTIVE: 'inactive',          // Không hoạt động
  MAINTENANCE: 'maintenance'     // Đang bảo dưỡng
};

// Trạng thái giao dịch
const TRANSACTION_STATUS = {
  PENDING: 'pending',            // Chờ xác nhận
  CONFIRMED: 'confirmed',        // Đã xác nhận
  REJECTED: 'rejected'           // Từ chối
};

// Loại giao dịch
const TRANSACTION_TYPE = {
  DEPOSIT: 'deposit',            // Nộp tiền
  EXPENSE: 'expense'             // Chi phí
};

// Loại chi phí
const EXPENSE_TYPE = {
  FUEL: 'fuel',                  // Xăng dầu
  MAINTENANCE: 'maintenance',    // Bảo dưỡng
  INSURANCE: 'insurance',        // Bảo hiểm
  DISPATCH: 'dispatch',          // Chi phí điều xe
  OTHER: 'other'                 // Khác
};

module.exports = {
  USER_ROLES,
  TRIP_STATUS,
  VEHICLE_STATUS,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  EXPENSE_TYPE
};