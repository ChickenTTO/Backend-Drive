const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { TRANSACTION_STATUS } = require('../utils/constants');

// @desc    Driver submits roadside expense claim with receipt photo
// @route   POST /api/expenses
// @access  Private (Driver)
exports.createExpense = async (req, res, next) => {
    try {
        const { tripId, type, amount, description, receiptImage } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe' });
        }

        if (!receiptImage) {
            return res.status(400).json({ success: false, message: 'Bắt buộc phải chụp và tải lên ảnh hóa đơn / biên lai minh chứng chi phí' });
        }

        const expense = await Expense.create({
            trip: trip._id,
            vehicle: trip.vehicle,
            driver: req.user._id,
            type,
            amount: Number(amount),
            description,
            receiptImage,
            status: TRANSACTION_STATUS.PENDING
        });

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu hoàn ứng chi phí thành công. Đang chờ Kế toán đối soát & phê duyệt.',
            data: expense
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all expenses (with filters by trip, driver, status)
// @route   GET /api/expenses
// @access  Private
exports.getAllExpenses = async (req, res, next) => {
    try {
        const { status, tripId, driverId } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (tripId) filter.trip = tripId;
        if (driverId) filter.driver = driverId;

        // If driver, limit to their own expenses
        if (req.user && req.user.role === 'driver') {
            filter.driver = req.user._id;
        }

        const expenses = await Expense.find(filter)
            .populate('trip', 'tripCode cargoType startDepot endDepot')
            .populate('vehicle', 'licensePlate brand weightCategory')
            .populate('driver', 'fullName phone')
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Accountant approves expense claim
// @route   PUT /api/expenses/:id/approve
// @access  Private (Accountant / Admin)
exports.approveExpense = async (req, res, next) => {
    try {
        const { approvalNote } = req.body;
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu chi phí' });
        }

        if (expense.status !== TRANSACTION_STATUS.PENDING) {
            return res.status(400).json({ success: false, message: `Chi phí này đã ở trạng thái "${expense.status}"` });
        }

        expense.status = TRANSACTION_STATUS.APPROVED;
        expense.approvedBy = req.user._id;
        expense.approvalDate = new Date();
        expense.approvalNote = approvalNote || 'Đã đối soát khớp với hóa đơn minh chứng.';
        await expense.save();

        // Update trip total approved expenses
        const trip = await Trip.findById(expense.trip);
        if (trip) {
            trip.totalExpenses = (trip.totalExpenses || 0) + expense.amount;
            await trip.save();
        }

        res.status(200).json({
            success: true,
            message: `Đã phê duyệt khoản chi phí ${expense.amount.toLocaleString('vi-VN')} VNĐ!`,
            data: expense
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Accountant rejects expense claim
// @route   PUT /api/expenses/:id/reject
// @access  Private (Accountant / Admin)
exports.rejectExpense = async (req, res, next) => {
    try {
        const { rejectionReason } = req.body;
        if (!rejectionReason) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối chi phí' });
        }

        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu chi phí' });
        }

        expense.status = TRANSACTION_STATUS.REJECTED;
        expense.approvedBy = req.user._id;
        expense.approvalDate = new Date();
        expense.rejectionReason = rejectionReason;
        await expense.save();

        res.status(200).json({
            success: true,
            message: 'Đã từ chối khoản chi phí đệ trình.',
            data: expense
        });
    } catch (error) {
        next(error);
    }
};