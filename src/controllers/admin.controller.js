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
