// PHẢI LÀ DÒNG 1: Load biến môi trường ngay lập tức
require('dotenv').config(); 

const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Kết nối database (Lúc này process.env.MONGO_URI chắc chắn đã có giá trị)
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
});