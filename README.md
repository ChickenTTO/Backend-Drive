# 🚕 Hệ thống Quản lý Vận tải (Taxi Management System)

API Backend cho hệ thống quản lý taxi/xe khách, xây dựng bằng Node.js, Express và MongoDB.

## 📋 Tính năng chính

### 1. Quản lý Người dùng & Phân quyền (RBAC)
- **Admin**: Toàn quyền
- **Dispatcher**: Vận hành chuyến đi, quản lý tài xế/xe
- **Driver**: Giao nhận xe, báo cáo trạng thái, nộp tiền
- **Accountant**: Xác nhận tiền, quản lý chi phí

### 2. Quản lý Vận hành
- Tạo và gán chuyến đi
- Cơ chế khách ghép (nhiều cuốc/xe)
- State machine cho trạng thái chuyến đi
- Tự động tính doanh thu và hoa hồng

### 3. Quản lý Xe & Tài xế
- CRUD xe và tài xế
- Lịch sử bảo dưỡng
- Theo dõi hoạt động

### 4. Giao nhận xe
- Checklist chi tiết khi nhận/trả xe
- Upload hình ảnh
- Không cho chỉnh sửa sau khi hoàn thành

### 5. Quản lý Tài chính
- Tài xế nộp tiền
- Kế toán xác nhận
- Quản lý chi phí vận hành

### 6. CRM Mini
- Tự động tạo khách hàng
- Lịch sử chuyến đi theo SĐT

### 7. Báo cáo
- Doanh thu theo xe
- Doanh thu theo nhân viên
- Chi phí
- Hiệu suất tài xế

## 🛠️ Công nghệ sử dụng

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📦 Cài đặt

### 1. Clone project
```bash
git clone <repository-url>
cd taxi-management-system
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taxi-management
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRE=7d
```

### 4. Import dữ liệu mẫu
```bash
npm run seed
```

### 5. Khởi động server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

### Authentication

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Trips (Chuyến đi)

#### Tạo chuyến đi
```http
POST /api/trips
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerPhone": "0911111111",
  "pickupLocation": {...},
  "dropoffLocation": {...},
  "scheduledTime": "2024-12-21T10:00:00Z",
  "estimatedPrice": 250000
}
```

#### Cập nhật trạng thái
```http
PATCH /api/trips/:id/status
Authorization: Bearer {token}

{
  "status": "completed",
  "actualPrice": 270000,
  "distance": 28.5
}
```

### Vehicles (Xe)
```http
GET /api/vehicles
POST /api/vehicles
GET /api/vehicles/:id
PUT /api/vehicles/:id
GET /api/vehicles/:id/revenue
```

### Transactions (Giao dịch)
```http
POST /api/transactions/deposit
PATCH /api/transactions/:id/confirm
GET /api/transactions/driver/unpaid
```

### Reports (Báo cáo)
```http
GET /api/reports/dashboard
GET /api/reports/revenue-by-car
GET /api/reports/revenue-by-staff
GET /api/reports/expenses
```

## 🔐 Tài khoản mặc định

Sau khi chạy `npm run seed`:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Dispatcher | dispatcher1 | dispatcher123 |
| Accountant | accountant1 | accountant123 |
| Driver | driver1 | driver123 |

## 📁 Cấu trúc Project
```
taxi-management-system/
├── src/
│   ├── config/          # Database & config files
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   └── app.js           # Express app
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── server.js            # Entry point
```

## 🚀 Scripts
```bash
npm start          # Khởi động production server
npm run dev        # Khởi động development server với nodemon
npm run seed       # Import dữ liệu mẫu
npm run seed:delete # Xóa toàn bộ dữ liệu
```

## 📊 Luồng hoạt động chính

### 1. Tạo chuyến đi
```
Dispatcher tạo chuyến → Gán tài xế & xe → 
Tài xế nhận chuyến → Đón khách → 
Hoàn thành → Tính doanh thu & hoa hồng
```

### 2. Nộp tiền
```
Tài xế nộp tiền → Kế toán xác nhận → 
Cập nhật trạng thái thanh toán
```

### 3. Giao nhận xe
```
Tài xế làm checklist → Upload hình ảnh → 
Dispatcher xác nhận → Khóa chỉnh sửa
```

## ⚠️ Lưu ý quan trọng

1. **Bảo mật**: Đổi `JWT_SECRET` trong production
2. **MongoDB**: Cấu hình MongoDB Atlas cho production
3. **Validation**: API đã có validation cơ bản, cần bổ sung theo nghiệp vụ
4. **Upload File**: Cần cấu hình Cloudinary để upload hình ảnh
5. **Rate Limiting**: API có rate limit 100 requests/15 phút

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB có chạy không
mongod --version

# Hoặc dùng MongoDB Compass để test connection
```

### Lỗi JWT
```bash
# Đảm bảo JWT_SECRET trong .env đủ dài (>=32 ký tự)
```

### Lỗi Port đã được sử dụng
```bash
# Thay đổi PORT trong .env hoặc kill process
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill
```

## 📞 Hỗ trợ

Nhắn trực tiếp cho NGUYỄN THÀNH ĐẠT SĐT: 0975249405

## 📄 License

MIT License# Backend-Drive
