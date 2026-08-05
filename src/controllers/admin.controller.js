const User = require('../models/User');

// Reactivate all users (set isActive=true). Protected + admin-only route.
exports.reactivateAll = async (req, res, next) => {
  try {
    const result = await User.updateMany({ isActive: { $ne: true } }, { $set: { isActive: true } });
    return res.status(200).json({ success: true, modifiedCount: result.modifiedCount || result.nModified || 0 });
  } catch (error) {
    next(error);
  }
};

// Reactivate single user by username or id
exports.reactivateUser = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const query = idOrUsername.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrUsername } : { username: idOrUsername };
    const user = await User.findOneAndUpdate(query, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Get all staff users with search and filter
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    let filter = {};

    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Create new staff user
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã tồn tại' });
    }

    const user = await User.create({
      username,
      email,
      password: password || '123456',
      fullName,
      phone,
      role: role || 'dispatcher',
      isActive: true
    });

    return res.status(201).json({ success: true, message: 'Tạo tài khoản nhân sự thành công', data: user });
  } catch (error) {
    next(error);
  }
};

// Update user details
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { fullName, email, phone, role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    return res.status(200).json({ success: true, message: 'Cập nhật nhân sự thành công', data: user });
  } catch (error) {
    next(error);
  }
};

// Toggle user Active / Inactive
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản thành công',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    return res.status(200).json({ success: true, message: 'Xóa nhân sự thành công' });
  } catch (error) {
    next(error);
  }
};

