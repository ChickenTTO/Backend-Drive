const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const morgan = require('morgan'); // Bỏ comment nếu muốn log request
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const driverRoutes = require('./routes/driver.routes');
const handoverRoutes = require('./routes/handover.routes');
const transactionRoutes = require('./routes/transaction.routes');
const customerRoutes = require('./routes/customer.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// --- MIDDLEWARE (Phần quan trọng để sửa lỗi) ---
app.use(helmet());
app.use(cors());

// Dòng này giúp server đọc được req.body (JSON)
app.use(express.json()); 
// Dòng này giúp đọc dữ liệu từ form (nếu cần)
app.use(express.urlencoded({ extended: true })); 

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Taxi Management System API is running...');
});

// Middleware xử lý lỗi (Optional nhưng nên có)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;