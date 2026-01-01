const Customer = require('../models/Customer');
const Trip = require('../models/Trip');

// @desc    Lấy danh sách khách hàng
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, isVIP, page = 1, limit = 20 } = req.query;

    let query = {};
    
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isVIP !== undefined) {
      query.isVIP = isVIP === 'true';
    }

    const skip = (page - 1) * limit;
    const total = await Customer.countDocuments(query);

    const customers = await Customer.find(query)
      .sort('-totalSpent')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: customers,
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

// @desc    Lấy chi tiết khách hàng
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate({
        path: 'trips',
        select: 'tripCode scheduledTime finalPrice status',
        options: { sort: '-scheduledTime', limit: 10 }
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch sử chuyến đi của khách hàng theo SĐT
// @route   GET /api/customers/phone/:phone/trips
// @access  Private
exports.getTripsByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng với số điện thoại này'
      });
    }

    const skip = (page - 1) * limit;
    const total = await Trip.countDocuments({ customer: customer._id });

    const trips = await Trip.find({ customer: customer._id })
      .populate('vehicle', 'licensePlate')
      .populate('driver', 'fullName phone')
      .sort('-scheduledTime')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          phone: customer.phone,
          name: customer.name,
          totalTrips: customer.totalTrips,
          totalSpent: customer.totalSpent
        },
        trips
      },
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

// @desc    Cập nhật thông tin khách hàng
// @route   PUT /api/customers/:id
// @access  Private (Admin, Dispatcher)
exports.updateCustomer = async (req, res, next) => {
  try {
    const { name, email, address, notes, isVIP } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, address, notes, isVIP },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin khách hàng thành công',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};