// Vai trò người dùng
const USER_ROLES = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  ACCOUNTANT: 'accountant'
};

// 05 Bãi xe trọng điểm của Futa Express
const DEPOT_LOCATIONS = [
  { code: 'HN', name: 'Bãi xe Hà Nội', city: 'Hà Nội', address: 'Bến xe Nước Ngầm, Hoàng Mai, Hà Nội', area: 15000, totalCapacity: 25 },
  { code: 'HP', name: 'Bãi xe Hải Phòng', city: 'Hải Phòng', address: 'Khu công nghiệp Đình Vũ, Hải An, Hải Phòng', area: 10000, totalCapacity: 15 },
  { code: 'DN', name: 'Bãi xe Đà Nẵng', city: 'Đà Nẵng', address: 'Cảng Tiên Sa, Sơn Trà, Đà Nẵng', area: 12000, totalCapacity: 20 },
  { code: 'HCM', name: 'Bãi xe TP.Hồ Chí Minh', city: 'TP.HCM', address: 'Bến xe Miền Đông mới, TP. Thủ Đức, TP.HCM', area: 20000, totalCapacity: 30 },
  { code: 'CT', name: 'Bãi xe Cần Thơ', city: 'Cần Thơ', address: 'Khu công nghiệp Trà Nóc, Bình Thủy, Cần Thơ', area: 8000, totalCapacity: 12 }
];

// Phân loại tải trọng xe tải
const WEIGHT_CATEGORY = {
  LIGHT: 'Tải nhẹ (1.5 - 3.5 tấn)',
  MEDIUM: 'Tải trung (5 - 8 tấn)',
  HEAVY: 'Tải nặng / Container (15 - 30 tấn)'
};

// Trạng thái chuyến đi hàng hóa
const TRIP_STATUS = {
  PENDING: 'Đang chờ',           // Mới khởi tạo, chờ nhận xe
  IN_TRANSIT: 'Đang vận hành',   // Đã nhận xe qua Barcode, trên đường
  COMPLETED: 'Hoàn tất',         // Đã bàn giao hàng & trả xe về bãi
  CANCELLED: 'Đã hủy'            // Hủy chuyến
};

// Trạng thái xe tải
const VEHICLE_STATUS = {
  READY: 'Sẵn sàng',            // Xe có sẵn ở bãi, chờ phân công
  OPERATING: 'Đang vận hành',    // Xe đang chạy trên đường
  MAINTENANCE: 'Đang bảo trì'    // Xe đang kiểm tra kỹ thuật/bảo dưỡng
};

// Trạng thái phê duyệt chi phí
const TRANSACTION_STATUS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối'
};

// Loại chi phí đường trường
const EXPENSE_TYPE = {
  FUEL: 'Xăng dầu',
  TOLL_BOT: 'Phí trạm BOT',
  REPAIR: 'Sửa chữa nhỏ / Vá lốp',
  OTHER: 'Chi phí khác'
};

module.exports = {
  USER_ROLES,
  DEPOT_LOCATIONS,
  WEIGHT_CATEGORY,
  TRIP_STATUS,
  VEHICLE_STATUS,
  TRANSACTION_STATUS,
  EXPENSE_TYPE
};