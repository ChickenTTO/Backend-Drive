const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Handover = require('../models/Handover');

// @desc    Create / Dispatch new Trip (Supports both Original Form & Futa Freight Dispatch Form)
// @route   POST /api/trips
// @access  Private
exports.createTrip = async (req, res, next) => {
    try {
        const {
            cargoType,
            cargoWeightTon,
            startDepotId,
            startDepot,
            endDepotId,
            endDepot,
            driverId,
            driver,
            vehicleId,
            vehicle,
            startLocation,
            pickupAddress,
            endLocation,
            dropoffAddress,
            customerName,
            customerPhone,
            fare,
            distance,
            notes
        } = req.body;

        const targetVehicleId = vehicleId || vehicle;
        const targetDriverId = driverId || driver;
        const targetStartDepot = startDepotId || startDepot;
        const targetEndDepot = endDepotId || endDepot;

        let foundVehicle = null;
        if (targetVehicleId) {
            foundVehicle = await Vehicle.findById(targetVehicleId);
        }

        // Auto-generate tripCode if not passed
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const tripCode = req.body.tripCode || `FUTA-${dateStr}-${randomNum}`;

        const tripData = {
            tripCode,
            cargoType: cargoType || 'Hàng hóa & Bưu chính Futa',
            cargoWeightTon: cargoWeightTon ? Number(cargoWeightTon) : 1.0,
            startDepot: targetStartDepot || null,
            endDepot: targetEndDepot || null,
            startLocation: startLocation || pickupAddress || 'Bãi xe Futa Express',
            endLocation: endLocation || dropoffAddress || 'Điểm giao hàng',
            customerName,
            customerPhone,
            fare: fare ? Number(fare) : 0,
            distance: distance ? Number(distance) : 0,
            dispatcher: req.user ? req.user._id : null,
            driver: targetDriverId || null,
            vehicle: targetVehicleId || null,
            startOdometer: foundVehicle ? foundVehicle.odometer : 0,
            startFuelLevel: foundVehicle ? foundVehicle.fuelLevel : 100,
            notes,
            status: 'Đang chờ'
        };

        const trip = await Trip.create(tripData);

        res.status(201).json({
            success: true,
            message: 'Khởi tạo và tạo chuyến thành công',
            data: trip
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private
exports.getAllTrips = async (req, res, next) => {
    try {
        const { status, driverId, vehicleId, depotId } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (driverId) filter.driver = driverId;
        if (vehicleId) filter.vehicle = vehicleId;
        if (depotId) {
            filter.$or = [{ startDepot: depotId }, { endDepot: depotId }];
        }

        if (req.user && req.user.role === 'driver') {
            filter.driver = req.user._id;
        }

        const trips = await Trip.find(filter)
            .populate('startDepot', 'name code city address')
            .populate('endDepot', 'name code city address')
            .populate('vehicle', 'licensePlate barcode brand model weightCategory')
            .populate('driver', 'fullName phone')
            .populate('dispatcher', 'fullName phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: trips
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Private
exports.getTripById = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('startDepot', 'name code city address')
            .populate('endDepot', 'name code city address')
            .populate('vehicle', 'licensePlate barcode brand model weightCategory maxPayloadTon')
            .populate('driver', 'fullName phone')
            .populate('dispatcher', 'fullName phone');

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe' });
        }

        const handovers = await Handover.find({ trip: trip._id }).sort({ createdAt: 1 });
        const expenses = await Expense.find({ trip: trip._id })
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 });

        const approvedExpensesSum = expenses
            .filter(e => e.status === 'Đã duyệt' || e.status === 'APPROVED')
            .reduce((sum, e) => sum + e.amount, 0);

        res.status(200).json({
            success: true,
            data: {
                trip,
                handovers,
                expenses,
                approvedExpensesSum
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update trip status
// @route   PUT /api/trips/:id/status
// @access  Private
exports.updateTripStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe' });
        }

        trip.status = status;
        if (status === 'Hoàn tất' || status === 'COMPLETED' || status === 'completed') {
            trip.endTime = new Date();
        }

        await trip.save();

        res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái chuyến xe sang: "${status}"`,
            data: trip
        });
    } catch (error) {
        next(error);
    }
};