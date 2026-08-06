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
            startTime: req.body.startTime ? new Date(req.body.startTime) : Date.now(),
            estimatedEndTime: req.body.estimatedEndTime ? new Date(req.body.estimatedEndTime) : null,
            startOdometer: foundVehicle ? foundVehicle.odometer : 0,
            startFuelLevel: foundVehicle ? (foundVehicle.fuelLiters || foundVehicle.fuelLevel) : 70,
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

// @desc    Update trip info
// @route   PUT /api/trips/:id
// @access  Private (Admin / Dispatcher)
exports.updateTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe cần cập nhật' });
        }

        const {
            cargoType,
            cargoWeightTon,
            startDepotId,
            endDepotId,
            driverId,
            vehicleId,
            startLocation,
            endLocation,
            customerName,
            customerPhone,
            fare,
            distance,
            startTime,
            estimatedEndTime,
            notes,
            status
        } = req.body;

        if (cargoType) trip.cargoType = cargoType;
        if (cargoWeightTon !== undefined) trip.cargoWeightTon = Number(cargoWeightTon);
        if (startDepotId) trip.startDepot = startDepotId;
        if (endDepotId) trip.endDepot = endDepotId;
        if (driverId) trip.driver = driverId;
        if (vehicleId) trip.vehicle = vehicleId;
        if (startLocation) trip.startLocation = startLocation;
        if (endLocation) trip.endLocation = endLocation;
        if (customerName) trip.customerName = customerName;
        if (customerPhone) trip.customerPhone = customerPhone;
        if (fare !== undefined) trip.fare = Number(fare);
        if (distance !== undefined) trip.distance = Number(distance);
        if (startTime) trip.startTime = new Date(startTime);
        if (estimatedEndTime) trip.estimatedEndTime = new Date(estimatedEndTime);
        if (notes !== undefined) trip.notes = notes;
        if (status) trip.status = status;

        await trip.save();

        const updatedTrip = await Trip.findById(trip._id)
            .populate('startDepot', 'name code city address')
            .populate('endDepot', 'name code city address')
            .populate('vehicle', 'licensePlate barcode brand model weightCategory')
            .populate('driver', 'fullName phone')
            .populate('dispatcher', 'fullName phone');

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin chuyến đi thành công!',
            data: updatedTrip
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

// @desc    Cancel trip
// @route   PUT /api/trips/:id/cancel
// @access  Private (Admin / Dispatcher)
exports.cancelTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe cần hủy' });
        }

        if (trip.status === 'Đang vận hành' || trip.status === 'Hoàn tất') {
            return res.status(400).json({
                success: false,
                message: `Quy tắc nghiệp vụ: Không thể HỦY chuyến đi đã ở trạng thái "${trip.status}"!`
            });
        }

        trip.status = 'Đã hủy';
        await trip.save();

        res.status(200).json({
            success: true,
            message: `Đã hủy chuyến đi [${trip.tripCode}] thành công.`,
            data: trip
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Dispatch trip: Recommend smart vehicle & assign driver & vehicle to trip
// @route   PUT /api/trips/:id/dispatch
// @access  Private (Admin / Dispatcher)
exports.dispatchTrip = async (req, res, next) => {
    try {
        const { vehicleId, driverId, startDepotId, endDepotId, notes } = req.body;
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe cần điều phối' });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe tải được chọn' });
        }

        const driver = await User.findById(driverId);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế được chọn' });
        }

        // Validate payload capacity vs cargo weight
        if (vehicle.maxPayloadTon < trip.cargoWeightTon) {
            return res.status(400).json({
                success: false,
                message: `Cảnh báo tải trọng: Xe ${vehicle.licensePlate} (${vehicle.maxPayloadTon} Tấn) không đủ sức chứa cho khối lượng hàng ${trip.cargoWeightTon} Tấn!`
            });
        }

        // Assign vehicle & driver to trip
        trip.vehicle = vehicle._id;
        trip.driver = driver._id;
        if (startDepotId) trip.startDepot = startDepotId;
        if (endDepotId) trip.endDepot = endDepotId;
        if (notes) trip.notes = notes;
        trip.status = 'Đang chờ';

        await trip.save();

        const updatedTrip = await Trip.findById(trip._id)
            .populate('startDepot', 'name code city address')
            .populate('endDepot', 'name code city address')
            .populate('vehicle', 'licensePlate barcode brand model weightCategory')
            .populate('driver', 'fullName phone')
            .populate('dispatcher', 'fullName phone');

        res.status(200).json({
            success: true,
            message: `Xác nhận điều phối thành công! Đã gán Xe ${vehicle.licensePlate} & Tài xế ${driver.fullName} cho chuyến ${trip.tripCode}.`,
            data: updatedTrip
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Recommend smart vehicles matching cargo weight and depot
// @route   GET /api/trips/recommend-vehicles
// @access  Private (Admin / Dispatcher)
exports.recommendVehicles = async (req, res, next) => {
    try {
        const { cargoWeightTon, depotId } = req.query;
        const targetWeight = Number(cargoWeightTon) || 1.0;

        let filter = { status: 'Sẵn sàng' };
        if (depotId) filter.depot = depotId;

        const vehicles = await Vehicle.find(filter)
            .populate('depot', 'name code city address')
            .populate('currentDriver', 'fullName phone');

        const rankedVehicles = vehicles.map(v => {
            const isMatch = (v.maxPayloadTon || 3.5) >= targetWeight;
            const diff = (v.maxPayloadTon || 3.5) - targetWeight;
            return {
                ...v.toObject(),
                isMatch,
                weightDiff: diff,
                score: isMatch ? (100 - diff) : -100
            };
        }).sort((a, b) => b.score - a.score);

        res.status(200).json({
            success: true,
            data: rankedVehicles
        });
    } catch (error) {
        next(error);
    }
};