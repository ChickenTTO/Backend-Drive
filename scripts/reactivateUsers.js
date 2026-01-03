// Script to set isActive=true for all users. Run with: node scripts/reactivateUsers.js
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../src/models/User');

(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('Please set MONGO_URI in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const res = await User.updateMany({ isActive: { $ne: true } }, { $set: { isActive: true } });
    console.log('Updated documents:', res.modifiedCount || res.nModified || res.n || 0);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
