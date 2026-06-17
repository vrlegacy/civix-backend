const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    enum: ["citizen", "admin", "official", "volunteer"],
    default: "citizen",
  },
  location: {
    type: String,
    trim: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180, // Expires after 3 minutes (automatic MongoDB TTL index)
  },
});

module.exports = mongoose.model("PendingUser", PendingUserSchema);
