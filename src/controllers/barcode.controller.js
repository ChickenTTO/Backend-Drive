const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { VEHICLE_STATUS, TRIP_STATUS } = require('../utils/constants');

// @desc    Scan / lookup vehicle by Barcode
// @route   POST /api/barcode/scan
// @access  Private (Driver / Dispatcher)
exports.scanBarcode = async (req, res, next) => {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã vạch xe tải (Barcode)' });
        }

        const vehicle = await Vehicle.findOne({ barcode: barcode.toUpperCase().trim() })
            .populate('depot', 'name city code address')
            .populate('currentDriver', 'fullName phone');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phương tiện với Mã vạch: "${barcode}" trong cơ sở dữ liệu Futa Express.`
            });
        }

        // Find active trip associated with vehicle if any
        const activeTrip = await Trip.findOne({
            vehicle: vehicle._id,
            status: { $in: [TRIP_STATUS.PENDING, TRIP_STATUS.IN_TRANSIT] }
        })
        .populate('startDepot', 'name city')
        .populate('endDepot', 'name city')
        .populate('driver', 'fullName phone')
        .populate('dispatcher', 'fullName');

        res.status(200).json({
            success: true,
            data: {
                vehicle: {
                    id: vehicle._id,
                    licensePlate: vehicle.licensePlate,
                    barcode: vehicle.barcode,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    weightCategory: vehicle.weightCategory,
                    maxPayloadTon: vehicle.maxPayloadTon,
                    status: vehicle.status,
                    odometer: vehicle.odometer,
                    fuelLevel: vehicle.fuelLevel,
                    fuelLiters: vehicle.fuelLiters || vehicle.fuelLevel,
                    depot: vehicle.depot
                },
                activeTrip: activeTrip || null
            }
        });
    } catch (error) {
        next(error);
    }
};
