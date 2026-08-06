const MaintenanceTicket = require('../models/MaintenanceTicket');
const Vehicle = require('../models/Vehicle');
const { VEHICLE_STATUS } = require('../utils/constants');

// @desc    Get all maintenance tickets
// @route   GET /api/maintenance
// @access  Public / Auth
exports.getAllTickets = async (req, res, next) => {
    try {
        const { status, licensePlate, search } = req.query;
        let filter = {};

        if (status && status !== 'ALL') filter.status = status;
        if (licensePlate) filter.licensePlate = licensePlate;

        if (search) {
            filter.$or = [
                { ticketCode: { $regex: search, $options: 'i' } },
                { licensePlate: { $regex: search, $options: 'i' } },
                { garage: { $regex: search, $options: 'i' } },
                { issue: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await MaintenanceTicket.find(filter)
            .populate('vehicle', 'licensePlate brand model status barcode')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single ticket by ID
// @route   GET /api/maintenance/:id
// @access  Public / Auth
exports.getTicketById = async (req, res, next) => {
    try {
        const ticket = await MaintenanceTicket.findById(req.params.id)
            .populate('vehicle', 'licensePlate brand model status barcode');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo dưỡng' });
        }

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new maintenance ticket
// @route   POST /api/maintenance
// @access  Private
exports.createTicket = async (req, res, next) => {
    try {
        const {
            licensePlate,
            brand,
            type,
            issue,
            garage,
            estimatedCost,
            actualCost,
            odometer,
            status,
            notes,
            partsReplaced
        } = req.body;

        if (!licensePlate || !issue) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Biển số xe và Nội dung bảo dưỡng' });
        }

        // Find linked vehicle if exists
        const matchedVehicle = await Vehicle.findOne({ licensePlate: licensePlate.trim() });

        // Auto-generate Ticket Code: MNT-YYYY-XXX
        const count = await MaintenanceTicket.countDocuments();
        const year = new Date().getFullYear();
        const ticketCode = `MNT-${year}-${String(count + 1).padStart(3, '0')}`;

        const ticket = await MaintenanceTicket.create({
            ticketCode,
            vehicle: matchedVehicle ? matchedVehicle._id : null,
            licensePlate: licensePlate.trim(),
            brand: brand || (matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : 'Xe Tải Futa'),
            type: type || 'Bảo dưỡng định kỳ',
            issue,
            garage: garage || 'Trung tâm Bảo dưỡng Futa Express Q9',
            estimatedCost: Number(estimatedCost) || 0,
            actualCost: Number(actualCost) || 0,
            odometer: Number(odometer) || (matchedVehicle ? matchedVehicle.odometer : 0),
            status: status || 'Chờ bảo dưỡng',
            partsReplaced: partsReplaced || '',
            notes: notes || '',
            startDate: new Date()
        });

        // Update vehicle status to Maintenance if in progress / pending
        if (matchedVehicle && (status === 'Đang bảo dưỡng' || status === 'Chờ bảo dưỡng')) {
            matchedVehicle.status = VEHICLE_STATUS.MAINTENANCE || 'Đang bảo trì';
            await matchedVehicle.save();
        }

        res.status(201).json({
            success: true,
            message: 'Tạo phiếu bảo dưỡng mới thành công',
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update maintenance ticket
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
    try {
        let ticket = await MaintenanceTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo dưỡng' });
        }

        const updates = req.body;
        if (updates.status === 'Hoàn thành' && !ticket.completedDate) {
            updates.completedDate = new Date();
        }

        ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

        // Sync vehicle status based on ticket status
        if (ticket.vehicle) {
            if (ticket.status === 'Hoàn thành') {
                await Vehicle.findByIdAndUpdate(ticket.vehicle, { status: VEHICLE_STATUS.READY || 'Sẵn sàng' });
            } else if (ticket.status === 'Đang bảo dưỡng' || ticket.status === 'Chờ bảo dưỡng') {
                await Vehicle.findByIdAndUpdate(ticket.vehicle, { status: VEHICLE_STATUS.MAINTENANCE || 'Đang bảo trì' });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phiếu bảo dưỡng thành công',
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete maintenance ticket
// @route   DELETE /api/maintenance/:id
// @access  Private
exports.deleteTicket = async (req, res, next) => {
    try {
        const ticket = await MaintenanceTicket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo dưỡng' });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa phiếu bảo dưỡng'
        });
    } catch (error) {
        next(error);
    }
};
