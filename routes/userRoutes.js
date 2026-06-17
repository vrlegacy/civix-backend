const express = require("express");
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// List volunteers (Admin only)
router.get("/volunteers", protect, authorize("admin"), userController.getVolunteers);
// Volunteer stats (Admin only)
router.get("/volunteers/stats", protect, authorize("admin"), userController.getVolunteerStats);

module.exports = router;
