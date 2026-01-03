require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const cors = require('cors'); // Import thư viện
const express = require('express');
const app = express();

app.use(cors()); 

app.use(express.json());

const PORT = process.env.PORT || 5000;

// Kết nối database
connectDB();

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📍 Môi trường: ${process.env.NODE_ENV}`);
});