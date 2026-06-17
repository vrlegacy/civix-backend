const mongoose = require("mongoose");
const PendingUser = require("./models/PendingUser");
const { sendVerificationEmail } = require("./utils/sendEmail");
const crypto = require("crypto");
require("dotenv").config();

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected!");

    const testEmail = `vrlegacy.care+test${Math.floor(Math.random() * 10000)}@gmail.com`;
    const token = crypto.randomBytes(32).toString("hex");

    console.log("Creating pending user...");
    const pendingUser = new PendingUser({
      name: "Test User",
      email: testEmail,
      password: "hashedpassword123",
      location: "San Jose",
      role: "citizen",
      token: token
    });

    console.log("Saving pending user...");
    await pendingUser.save();
    console.log("✅ Pending user saved!");

    console.log("Sending verification email...");
    await sendVerificationEmail(testEmail, "Test User", token);
    console.log("✅ Verification email sent!");

    // Clean up
    console.log("Cleaning up test pending user...");
    await PendingUser.deleteOne({ _id: pendingUser._id });
    console.log("✅ Cleaned up!");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Stack Trace:", error);
    process.exit(1);
  }
})();
