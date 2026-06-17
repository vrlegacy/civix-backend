const User = require("../models/User");
const Complaint = require("../models/complaint");

// @desc    List all volunteers (Admin only)
// @route   GET /api/users/volunteers
// @access  Private/Admin
exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: "volunteer" }).select(
      "name email"
    );
    
    // Return array of { id, name, email }
    const resp = volunteers.map((v) => ({
      id: v._id.toString(),
      name: v.name || v.email || v._id.toString(),
      email: v.email || null,
    }));
    
    res.json({ volunteers: resp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Volunteer stats (Admin only)
// @route   GET /api/users/volunteers/stats
// @access  Private/Admin
exports.getVolunteerStats = async (req, res) => {
  try {
    const totalVolunteers = await User.countDocuments({ role: "volunteer" });
    const activeAssignments = await Complaint.countDocuments({ assigned_to: { $ne: null } });
    res.json({ totalVolunteers, activeAssignments });
  } catch (err) {
    console.error('Failed to fetch volunteer stats:', err);
    res.status(500).json({ error: err.message });
  }
};
