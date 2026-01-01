const Expense = require('../models/Expense');
const { TRANSACTION_STATUS, USER_ROLES } = require('../utils/constants');

// @desc    Tạo chi phí mới
// @route   POST /api/expenses
// @access  Private (Admin, Dispatcher)
exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user.id
    });

    await expense.populate([
      { path: 'createdBy', select: 'fullName phone' },
      { path: 'vehicle', select: 'licensePlate' },
      { path: 'trip', select: 'tripCode' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo chi phí thành công',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách chi phí
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
  try {
    const {
      type,
      status,
      vehicleId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    // Nếu là Dispatcher, chỉ xem chi phí của mình
    if (req.user.role === USER_ROLES.DISPATCHER) {
      query.createdBy = req.user.id;
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (vehicleId) query.vehicle = vehicleId;

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await Expense.countDocuments(query);

    const expenses = await Expense.find(query)
      .populate('createdBy', 'fullName phone')
      .populate('approvedBy', 'fullName')
      .populate('vehicle', 'licensePlate')
      .populate('trip', 'tripCode')
      .sort('-expenseDate')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: expenses,
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

// @desc    Lấy chi tiết chi phí
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'fullName phone')
      .populate('approvedBy', 'fullName phone')
      .populate('vehicle')
      .populate('trip');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi phí'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật chi phí
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi phí'
      });
    }

    // Chỉ người tạo hoặc Admin mới được sửa
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      expense.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa chi phí này'
      });
    }

    // Không cho sửa nếu đã được phê duyệt
    if (expense.status !== TRANSACTION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa chi phí đã được xử lý'
      });
    }

    const allowedUpdates = ['type', 'description', 'amount', 'expenseDate', 'vehicle', 'trip', 'notes'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    await expense.save();

    res.json({
      success: true,
      message: 'Cập nhật chi phí thành công',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Phê duyệt chi phí
// @route   PATCH /api/expenses/:id/approve
// @access  Private (Accountant, Admin)
exports.approveExpense = async (req, res, next) => {
  try {
    const { approvalNote } = req.body;

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi phí'
      });
    }

    if (expense.status !== TRANSACTION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Chi phí đã được xử lý'
      });
    }

    expense.status = TRANSACTION_STATUS.CONFIRMED;
    expense.approvedBy = req.user.id;
    expense.approvedDate = new Date();
    expense.approvalNote = approvalNote;

    await expense.save();

    res.json({
      success: true,
      message: 'Phê duyệt chi phí thành công',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Từ chối chi phí
// @route   PATCH /api/expenses/:id/reject
// @access  Private (Accountant, Admin)
exports.rejectExpense = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi phí'
      });
    }

    if (expense.status !== TRANSACTION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Chi phí đã được xử lý'
      });
    }

    expense.status = TRANSACTION_STATUS.REJECTED;
    expense.approvedBy = req.user.id;
    expense.approvedDate = new Date();
    expense.rejectionReason = rejectionReason;

    await expense.save();

    res.json({
      success: true,
      message: 'Từ chối chi phí thành công',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa chi phí
// @route   DELETE /api/expenses/:id
// @access  Private (Admin only)
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi phí'
      });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Xóa chi phí thành công'
    });
  } catch (error) {
    next(error);
  }
};