const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./src/models/User");

const testCredentials = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "adminDat", password: "Dat@2005", role: "admin" },
  { username: "dispatcher1", password: "dispatcher123", role: "dispatcher" },
  { username: "accountant1", password: "accountant123", role: "accountant" },
  { username: "driver1", password: "driver123", role: "driver" },
];

async function verify() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected.");

    for (const cred of testCredentials) {
      console.log(`Checking user: ${cred.username}...`);
      const user = await User.findOne({ username: cred.username }).select(
        "+password",
      );
      if (!user) {
        console.error(`❌ User not found: ${cred.username}`);
        continue;
      }
      const isMatch = await user.matchPassword(cred.password);
      if (isMatch) {
        console.log(
          `✅ User ${cred.username} password match OK! Role: ${user.role} (Expected: ${cred.role})`,
        );
      } else {
        console.error(`❌ User ${cred.username} password check FAILED!`);
      }
    }
  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Connection closed.");
  }
}

verify();
