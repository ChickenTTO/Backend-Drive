const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const assignmentRoutes = require("./routes/assignment.routes");

const app = express();

// --- MIDDLEWARE ---
app.use(helmet());
app.use(cors({
    origin: 'https://driver-git-main-chickenttos-projects.vercel.app', // Frontend Vercel
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true // nếu dùng cookie/token
}));
app.use(express.json()); 
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
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/assignments", assignmentRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Taxi Management System API is running...');
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;
