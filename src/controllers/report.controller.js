const Vehicle = require('../models/Vehicle');
const Depot = require('../models/Depot');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');

// @desc    Get Admin Dashboard & Analytics Summary
// @route   GET /api/reports/dashboard
// @access  Private (Admin / Accountant / Dispatcher)
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalDepots = await Depot.countDocuments();
        const totalVehicles = await Vehicle.countDocuments();

        const readyVehicles = await Vehicle.countDocuments({ status: { $in: ['Sẵn sàng', 'READY', 'available', 'active'] } });
        const operatingVehicles = await Vehicle.countDocuments({ status: { $in: ['Đang vận hành', 'OPERATING', 'rented', 'busy'] } });
        const maintenanceVehicles = await Vehicle.countDocuments({ status: { $in: ['Bảo trì', 'Đang bảo trì', 'MAINTENANCE'] } });

        const lightTrucks = await Vehicle.countDocuments({ weightCategory: '1.5 - 3.5 Tấn' });
        const mediumTrucks = await Vehicle.countDocuments({ weightCategory: '5 - 8 Tấn' });
        const heavyTrucks = await Vehicle.countDocuments({ weightCategory: '15 - 30 Tấn' });

        const totalTrips = await Trip.countDocuments();
        const inTransitTrips = await Trip.countDocuments({ status: { $in: ['Đang vận hành', 'in_transit', 'ongoing', 'Đang chạy', 'assigned'] } });
        const completedTrips = await Trip.countDocuments({ status: { $in: ['Hoàn tất', 'completed'] } });

        // Calculate total approved roadside expenses
        const approvedExpenses = await Expense.find({ status: { $in: ['Đã duyệt', 'APPROVED'] } });
        const totalExpensesAmount = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const pendingExpensesCount = await Expense.countDocuments({ status: { $in: ['Chờ duyệt', 'PENDING', 'pending'] } });

        // Calculate total revenue from completed trips
        const completedTripDocs = await Trip.find({ status: { $in: ['Hoàn tất', 'completed'] } });
        const totalRevenueAmount = completedTripDocs.reduce((sum, t) => sum + (t.fare || t.price || 0), 0);

        // Group expenses by type
        const expenseByType = {
          'Xăng dầu': 0,
          'Phí trạm BOT': 0,
          'Sửa chữa nhỏ / Vá lốp': 0,
          'Chi phí khác': 0
        };
        approvedExpenses.forEach(e => {
          if (expenseByType[e.type] !== undefined) {
            expenseByType[e.type] += e.amount;
          } else {
            expenseByType['Chi phí khác'] += e.amount;
          }
        });

        res.status(200).json({
            success: true,
            data: {
                depots: {
                    total: totalDepots
                },
                fleet: {
                    total: totalVehicles,
                    ready: readyVehicles,
                    operating: operatingVehicles,
                    maintenance: maintenanceVehicles,
                    byWeight: {
                        light: lightTrucks,
                        medium: mediumTrucks,
                        heavy: heavyTrucks
                    }
                },
                trips: {
                    total: totalTrips,
                    inTransit: inTransitTrips,
                    completed: completedTrips
                },
                financials: {
                    totalRevenueAmount,
                    totalExpensesAmount,
                    pendingExpensesCount,
                    expenseByType
                }
            }
        });
    } catch (error) {
        next(error);
    }
};