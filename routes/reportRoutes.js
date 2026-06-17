const express = require("express");
const reportController = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// Get sentiment analysis for a specific entity (complaint/petition/poll)
router.get("/sentiment/:type/:id", protect, reportController.getEntitySentiment);

// Aggregate sentiment analysis across petitions, polls, and complaints (Official/Admin)
router.get(
  "/sentiment",
  protect,
  authorize("official", "admin"),
  reportController.getAggregateSentiment
);

// Monthly engagement metrics (Official/Admin)
router.get(
  "/engagement",
  protect,
  authorize("official", "admin"),
  reportController.getEngagementData
);

// CSV Data Export (Official/Admin)
router.get(
  "/export",
  protect,
  authorize("official", "admin"),
  reportController.exportData
);

module.exports = router;
