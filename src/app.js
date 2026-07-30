const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth.routes');
const depotRoutes = require('./routes/depot.routes');
const barcodeRoutes = require('./routes/barcode.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const handoverRoutes = require('./routes/handover.routes');
const expenseRoutes = require('./routes/expense.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const customerRoutes = require('./routes/customer.routes');
const driverRoutes = require('./routes/driver.routes');
const bookingRoutes = require('./routes/booking.routes');

const app = express();

// --- MIDDLEWARE ---
app.use(helmet());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://driver-git-main-chickenttos-projects.vercel.app',
    'https://drive-git-main-chickenttos-projects.vercel.app',
    'https://driver-kappa-eight.vercel.app'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow during development
        }
    },
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/depots', depotRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Futa Express Logistics & Fleet Management System API is running...');
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
