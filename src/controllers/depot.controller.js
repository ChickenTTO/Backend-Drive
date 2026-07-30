const Depot = require('../models/Depot');
const Vehicle = require('../models/Vehicle');
const { VEHICLE_STATUS, WEIGHT_CATEGORY } = require('../utils/constants');

// @desc    Get all 05 Depots with real-time fleet statistics
// @route   GET /api/depots
// @access  Public / Auth
exports.getAllDepots = async (req, res, next) => {
    try {
        const depots = await Depot.find().sort({ code: 1 });
        
        // Enhance depots with live counts
        const depotStats = await Promise.all(depots.map(async (depot) => {
            const vehicles = await Vehicle.find({ depot: depot._id });
            const totalVehicles = vehicles.length;
            const readyVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.READY).length;
            const operatingVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.OPERATING).length;
            const maintenanceVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.MAINTENANCE).length;

            const lightTrucks = vehicles.filter(v => v.weightCategory === WEIGHT_CATEGORY.LIGHT).length;
            const mediumTrucks = vehicles.filter(v => v.weightCategory === WEIGHT_CATEGORY.MEDIUM).length;
            const heavyTrucks = vehicles.filter(v => v.weightCategory === WEIGHT_CATEGORY.HEAVY).length;

            return {
                ...depot.toObject(),
                stats: {
                    totalVehicles,
                    readyVehicles,
                    operatingVehicles,
                    maintenanceVehicles,
                    byWeight: {
                        light: lightTrucks,
                        medium: mediumTrucks,
                        heavy: heavyTrucks
                    }
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: depotStats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single Depot detail with vehicles
// @route   GET /api/depots/:id
// @access  Public / Auth
exports.getDepotById = async (req, res, next) => {
    try {
        const depot = await Depot.findById(req.params.id);
        if (!depot) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bãi xe' });
        }

        const vehicles = await Vehicle.find({ depot: depot._id }).populate('currentDriver', 'fullName phone');

        res.status(200).json({
            success: true,
            data: {
                depot,
                vehicles
            }
        });
    } catch (error) {
        next(error);
    }
};
