
require('dotenv').config(); 

const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;


connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
});