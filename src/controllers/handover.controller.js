const Handover = require('../models/Handover');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const { TRIP_STATUS, VEHICLE_STATUS } = require('../utils/constants');

// @desc    Create Electronic Handover (Check-Out or Check-In) via Barcode
// @route   POST /api/handovers
// @access  Private (Driver / Dispatcher)
exports.createHandover = async (req, res, next) => {
    try {
        const {
            type,
            tripId,
            barcode,
            odometerReading,
            fuelLiters,
            fuelLevelPercent,
            photos, // { cabin, cargoBox, tires, odometer, fuelGauge }
            generalNotes
        } = req.body;

        const actualFuelLiters = fuelLiters !== undefined ? Number(fuelLiters) : Number(fuelLevelPercent || 0);

        if (!type || !['CHECK_OUT', 'CHECK_IN'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Loại biên bản bàn giao (CHECK_OUT / CHECK_IN) là bắt buộc' });
        }

        const trip = await Trip.findById(tripId).populate('vehicle').populate('startDepot').populate('endDepot');
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe liên quan' });
        }

        const vehicle = trip.vehicle;
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe tải liên quan' });
        }

        // Validate Barcode matching
        if (vehicle.barcode.toUpperCase().trim() !== barcode.toUpperCase().trim()) {
            return res.status(400).json({
                success: false,
                message: `Mã vạch nhập vào (${barcode}) không trùng khớp với mã định danh của xe tải (${vehicle.barcode}).`
            });
        }

        // Validate mandatory photos (Cabin, Cargo box, Tires)
        if (!photos || !photos.cabin || !photos.cargoBox || !photos.tires) {
            return res.status(400).json({
                success: false,
                message: 'Bắt buộc phải tải lên đầy đủ 03 ảnh chụp hiện trạng: Cabin xe, Thùng xe và Lốp xe.'
            });
        }

        const depotId = type === 'CHECK_OUT' ? trip.startDepot._id : trip.endDepot._id;

        // Create locked Handover record
        const handover = await Handover.create({
            type,
            trip: trip._id,
            vehicle: vehicle._id,
            driver: req.user._id,
            depot: depotId,
            barcode: barcode.toUpperCase().trim(),
            odometerReading: Number(odometerReading),
            fuelLiters: actualFuelLiters,
            fuelLevelPercent: actualFuelLiters,
            photos: {
                cabin: photos.cabin,
                cargoBox: photos.cargoBox,
                tires: photos.tires,
                odometer: photos.odometer || photos.cabin,
                fuelGauge: photos.fuelGauge || photos.cabin
            },
            generalNotes,
            isCompleted: true
        });

        // Update Vehicle and Trip states based on Check-Out or Check-In
        if (type === 'CHECK_OUT') {
            // Driver receives vehicle & starts trip
            vehicle.status = VEHICLE_STATUS.OPERATING;
            vehicle.currentDriver = req.user._id;
            vehicle.odometer = Number(odometerReading);
            vehicle.fuelLevel = actualFuelLiters;
            vehicle.fuelLiters = actualFuelLiters;
            await vehicle.save();

            trip.status = TRIP_STATUS.IN_TRANSIT;
            trip.startOdometer = Number(odometerReading);
            trip.startFuelLevel = actualFuelLiters;
            await trip.save();
        } else if (type === 'CHECK_IN') {
            // Driver returns vehicle at destination depot & completes trip
            vehicle.status = VEHICLE_STATUS.READY;
            vehicle.depot = trip.endDepot._id; // Vehicle transferred to destination depot
            vehicle.currentDriver = null;
            vehicle.odometer = Number(odometerReading);
            vehicle.fuelLevel = actualFuelLiters;
            vehicle.fuelLiters = actualFuelLiters;
            await vehicle.save();

            trip.status = TRIP_STATUS.COMPLETED;
            trip.endTime = new Date();
            trip.endOdometer = Number(odometerReading);
            trip.endFuelLevel = actualFuelLiters;
            await trip.save();
        }

        res.status(201).json({
            success: true,
            message: type === 'CHECK_OUT' 
                ? 'Đã hoàn tất Biên bản bàn giao nhận xe! Chuyển trạng thái xe sang Đang vận hành.' 
                : 'Đã hoàn tất Biên bản trả xe! Chuyến xe đã đóng, phương tiện trở về trạng thái Sẵn sàng tại bãi xe đến.',
            data: handover
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get handovers by trip
// @route   GET /api/handovers/trip/:tripId
// @access  Private
exports.getHandoversByTrip = async (req, res, next) => {
    try {
        const handovers = await Handover.find({ trip: req.params.tripId })
            .populate('driver', 'fullName phone')
            .populate('depot', 'name city')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: handovers
        });
    } catch (error) {
        next(error);
    }
};