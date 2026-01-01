const Transaction = require('../models/Transaction');
const Trip = require('../models/Trip');
const { TRANSACTION_STATUS, TRANSACTION_TYPE, USER_ROLES } = require('../utils/constants');

// @desc    Tài xế nộp tiền
// @route   POST /api/transactions/deposit
// @access  Private (Driver)
exports.createDeposit = async (req, res, next) => {
  try {
    const { amount, tripIds, paymentMethod, description } = req.body;

    // Kiểm tra các chuyến đi
    if (tripIds && tripIds.length > 0) {
      const trips = await Trip.find({
        _id: { $in: tripIds },
        driver: req.user.id,
        status: 'completed',
        isPaid: false
      });

      if (trips.length !== tripIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số chuyến đi không hợp lệ hoặc đã được thanh toán'
        });
      }
    }

    // Tạo giao dịch
    const transaction = await Transaction.create({
      type: TRANSACTION_TYPE.DEPOSIT,
      createdBy: req.user.id,
      amount,
      trips: tripIds || [],
      paymentMethod: paymentMethod || 'Tiền mặt',
      description: description || 'Nộp tiền ca làm việc',
      status: TRANSACTION_STATUS.PENDING
    });

    await transaction.populate([
      { path: 'createdBy', select: 'fullName phone' },
      { path: 'trips', select: 'tripCode finalPrice' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu nộp tiền thành công, chờ kế toán xác nhận',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách giao dịch
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { 
      type, 
      status, 
      driverId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // Driver chỉ xem được giao dịch của mình
    if (req.user.role === USER_ROLES.DRIVER) {
      query.createdBy = req.user.id;
    } else if (driverId) {
      query.createdBy = driverId;
    }

    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .populate('createdBy', 'fullName phone')
      .populate('confirmedBy', 'fullName')
      .populate('trips', 'tripCode finalPrice')
      .populate('vehicle', 'licensePlate')
      .sort('-transactionDate')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kế toán xác nhận giao dịch
// @route   PATCH /api/transactions/:id/confirm
// @access  Private (Accountant, Admin)
exports.confirmTransaction = async (req, res, next) => {
  try {
    const { accountantNote } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    if (transaction.status !== TRANSACTION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Giao dịch đã được xử lý'
      });
    }

    transaction.status = TRANSACTION_STATUS.CONFIRMED;
    transaction.confirmedBy = req.user.id;
    transaction.confirmedDate = new Date();
    transaction.accountantNote = accountantNote;

    await transaction.save();

    // Cập nhật trạng thái thanh toán của các chuyến đi
    if (transaction.trips && transaction.trips.length > 0) {
      await Trip.updateMany(
        { _id: { $in: transaction.trips } },
        { isPaid: true }
      );
    }

    await transaction.populate([
      { path: 'createdBy', select: 'fullName phone' },
      { path: 'confirmedBy', select: 'fullName' }
    ]);

    res.json({
      success: true,
      message: 'Xác nhận giao dịch thành công',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kế toán từ chối giao dịch
// @route   PATCH /api/transactions/:id/reject
// @access  Private (Accountant, Admin)
exports.rejectTransaction = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    if (transaction.status !== TRANSACTION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Giao dịch đã được xử lý'
      });
    }

    transaction.status = TRANSACTION_STATUS.REJECTED;
    transaction.confirmedBy = req.user.id;
    transaction.confirmedDate = new Date();
    transaction.rejectionReason = rejectionReason;

    await transaction.save();

    res.json({
      success: true,
      message: 'Từ chối giao dịch thành công',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tính tổng tiền chưa nộp của tài xế
// @route   GET /api/transactions/driver/unpaid
// @access  Private (Driver)
exports.getUnpaidAmount = async (req, res, next) => {
  try {
    // Lấy các chuyến đã hoàn thành nhưng chưa thanh toán
    const unpaidTrips = await Trip.find({
      driver: req.user.id,
      status: 'completed',
      isPaid: false
    }).select('tripCode finalPrice completedTime');

    const totalUnpaid = unpaidTrips.reduce((sum, trip) => sum + trip.finalPrice, 0);

    res.json({
      success: true,
      data: {
        totalUnpaid,
        tripCount: unpaidTrips.length,
        trips: unpaidTrips
      }
    });
  } catch (error) {
    next(error);
  }
};