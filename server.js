require('dotenv').config();
const app = require('./src/app'); // Lấy app đã cấu hình từ file trên
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Kết nối database
connectDB();

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📍 Môi trường: ${process.env.NODE_ENV}`);
});