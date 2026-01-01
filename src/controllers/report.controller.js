const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { USER_ROLES } = require('../utils/constants');

// @desc    Báo cáo doanh thu theo xe
// @route   GET /api/reports/revenue-by-car
// @access  Private (Admin, Accountant)
exports.getRevenueByVehicle = async (req, res, next) => {
  try {
    const { startDate, endDate, vehicleId } = req.query;

    // Build date filter
    let dateFilter = { status: 'completed' };
    if (startDate || endDate) {
      dateFilter.completedTime = {};
      if (startDate) dateFilter.completedTime.$gte = new Date(startDate);
      if (endDate) dateFilter.completedTime.$lte = new Date(endDate);
    }

    // Filter by vehicle if specified
    if (vehicleId) {
      dateFilter.vehicle = vehicleId;
    }

    // Aggregate revenue by vehicle
    const revenueData = await Trip.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$vehicle',
          totalRevenue: { $sum: '$finalPrice' },
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          avgPrice: { $avg: '$finalPrice' }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      { $unwind: '$vehicleInfo' },
      {
        $project: {
          vehicleId: '$_id',
          licensePlate: '$vehicleInfo.licensePlate',
          brand: '$vehicleInfo.brand',
          model: '$vehicleInfo.model',
          totalRevenue: 1,
          totalTrips: 1,
          totalDistance: 1,
          avgPrice: { $round: ['$avgPrice', 0] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate totals
    const totals = revenueData.reduce((acc, item) => ({
      totalRevenue: acc.totalRevenue + item.totalRevenue,
      totalTrips: acc.totalTrips + item.totalTrips,
      totalDistance: acc.totalDistance + item.totalDistance
    }), { totalRevenue: 0, totalTrips: 0, totalDistance: 0 });

    res.json({
      success: true,
      data: {
        summary: totals,
        details: revenueData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Báo cáo doanh thu theo nhân viên (hoa hồng)
// @route   GET /api/reports/revenue-by-staff
// @access  Private (Admin)
exports.getRevenueByStaff = async (req, res, next) => {
  try {
    const { startDate, endDate, role } = req.query;

    // Build date filter
    let dateFilter = { status: 'completed', commissionAmount: { $gt: 0 } };
    if (startDate || endDate) {
      dateFilter.completedTime = {};
      if (startDate) dateFilter.completedTime.$gte = new Date(startDate);
      if (endDate) dateFilter.completedTime.$lte = new Date(endDate);
    }

    // Aggregate commission by dispatcher
    const staffRevenue = await Trip.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$dispatcher',
          totalCommission: { $sum: '$commissionAmount' },
          totalTrips: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staffInfo'
        }
      },
      { $unwind: '$staffInfo' },
      {
        $project: {
          staffId: '$_id',
          fullName: '$staffInfo.fullName',
          phone: '$staffInfo.phone',
          role: '$staffInfo.role',
          commissionRate: '$staffInfo.commissionRate',
          totalCommission: { $round: ['$totalCommission', 0] },
          totalTrips: 1,
          totalRevenue: { $round: ['$totalRevenue', 0] }
        }
      },
      { $sort: { totalCommission: -1 } }
    ]);

    // Filter by role if specified
    let filteredData = staffRevenue;
    if (role) {
      filteredData = staffRevenue.filter(item => item.role === role);
    }

    const totals = filteredData.reduce((acc, item) => ({
      totalCommission: acc.totalCommission + item.totalCommission,
      totalTrips: acc.totalTrips + item.totalTrips,
      totalRevenue: acc.totalRevenue + item.totalRevenue
    }), { totalCommission: 0, totalTrips: 0, totalRevenue: 0 });

    res.json({
      success: true,
      data: {
        summary: totals,
        details: filteredData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Báo cáo chi phí
// @route   GET /api/reports/expenses
// @access  Private (Admin, Accountant)
exports.getExpensesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type, status, vehicleId } = req.query;

    // Build filter
    let filter = {};
    
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (vehicleId) filter.vehicle = vehicleId;

    // Aggregate by type
    const expensesByType = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Aggregate by vehicle
    const expensesByVehicle = await Expense.aggregate([
      { $match: { ...filter, vehicle: { $ne: null } } },
      {
        $group: {
          _id: '$vehicle',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      { $unwind: '$vehicleInfo' },
      {
        $project: {
          vehicleId: '$_id',
          licensePlate: '$vehicleInfo.licensePlate',
          totalAmount: 1,
          count: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get detailed expenses
    const expenses = await Expense.find(filter)
      .populate('vehicle', 'licensePlate')
      .populate('createdBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort('-expenseDate')
      .limit(100);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          totalCount: expenses.length,
          byType: expensesByType,
          byVehicle: expensesByVehicle
        },
        recentExpenses: expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Báo cáo tổng quan dashboard
// @route   GET /api/reports/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter for today by default
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.completedTime = {};
      if (startDate) dateFilter.completedTime.$gte = new Date(startDate);
      if (endDate) dateFilter.completedTime.$lte = new Date(endDate);
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.completedTime = { $gte: today };
    }

    // Total revenue
    const revenueData = await Trip.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalPrice' },
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: '$distance' }
        }
      }
    ]);

    // Active trips
    const activeTrips = await Trip.countDocuments({
      status: { $in: ['assigned', 'called', 'picked_up'] }
    });

    // Active vehicles
    const activeVehicles = await Vehicle.countDocuments({
      status: 'active',
      currentDriver: { $ne: null }
    });

    // Pending transactions
    const pendingTransactions = await Transaction.countDocuments({
      status: 'pending'
    });

    // Pending expenses
    const pendingExpenses = await Expense.countDocuments({
      status: 'pending'
    });

    // Active drivers
    const activeDrivers = await User.countDocuments({
      role: USER_ROLES.DRIVER,
      isActive: true
    });

    // Total customers
    const totalCustomers = await require('../models/Customer').countDocuments();

    // Recent trips
    const recentTrips = await Trip.find()
      .populate('customer', 'phone name')
      .populate('vehicle', 'licensePlate')
      .populate('driver', 'fullName')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          totalTrips: revenueData[0]?.totalTrips || 0,
          totalDistance: revenueData[0]?.totalDistance || 0,
          activeTrips,
          activeVehicles,
          activeDrivers,
          totalCustomers,
          pendingTransactions,
          pendingExpenses
        },
        recentTrips
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Báo cáo hiệu suất tài xế
// @route   GET /api/reports/driver-performance
// @access  Private (Admin, Dispatcher)
exports.getDriverPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, driverId } = req.query;

    let dateFilter = { status: 'completed' };
    if (startDate || endDate) {
      dateFilter.completedTime = {};
      if (startDate) dateFilter.completedTime.$gte = new Date(startDate);
      if (endDate) dateFilter.completedTime.$lte = new Date(endDate);
    }

    if (driverId) {
      dateFilter.driver = driverId;
    }

    const driverStats = await Trip.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$driver',
          totalTrips: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' },
          totalDistance: { $sum: '$distance' },
          avgPrice: { $avg: '$finalPrice' },
          avgRating: { $avg: '$rating.score' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo'
        }
      },
      { $unwind: '$driverInfo' },
      {
        $project: {
          driverId: '$_id',
          fullName: '$driverInfo.fullName',
          phone: '$driverInfo.phone',
          totalTrips: 1,
          totalRevenue: { $round: ['$totalRevenue', 0] },
          totalDistance: { $round: ['$totalDistance', 2] },
          avgPrice: { $round: ['$avgPrice', 0] },
          avgRating: { $round: ['$avgRating', 1] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: driverStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Báo cáo theo thời gian (theo ngày/tháng)
// @route   GET /api/reports/revenue-by-time
// @access  Private (Admin, Accountant)
exports.getRevenueByTime = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let dateFilter = { status: 'completed' };
    if (startDate || endDate) {
      dateFilter.completedTime = {};
      if (startDate) dateFilter.completedTime.$gte = new Date(startDate);
      if (endDate) dateFilter.completedTime.$lte = new Date(endDate);
    }

    // Group format based on groupBy parameter
    let dateGroupFormat;
    if (groupBy === 'month') {
      dateGroupFormat = { $dateToString: { format: "%Y-%m", date: "$completedTime" } };
    } else if (groupBy === 'year') {
      dateGroupFormat = { $dateToString: { format: "%Y", date: "$completedTime" } };
    } else {
      dateGroupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$completedTime" } };
    }

    const timeSeriesData = await Trip.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: dateGroupFormat,
          totalRevenue: { $sum: '$finalPrice' },
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          avgPrice: { $avg: '$finalPrice' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 0] },
          totalTrips: 1,
          totalDistance: { $round: ['$totalDistance', 2] },
          avgPrice: { $round: ['$avgPrice', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: timeSeriesData
    });
  } catch (error) {
    next(error);
  }
};