const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Mongoose 9 không cần các options như useNewUrlParser nữa
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`✅ Đã kết nối MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
        process.exit(1); // Dừng chương trình nếu lỗi
    }
};

module.exports = connectDB;