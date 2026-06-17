const express = require("express");
const pollController = require("../controllers/pollController");
const { protect } = require("../middleware/authmiddleware");

const router = express.Router();

// Create a new poll (any authenticated user can create a poll, or restricted as needed - original didn't restrict to roles, only protected)
router.post("/", protect, pollController.createPoll);

// List all polls
router.get("/", protect, pollController.getAllPolls);

// Submit a vote
router.post("/:id/vote", protect, pollController.submitVote);

// Get vote counts for a poll
router.get("/:id/votes", protect, pollController.getVoteCounts);

// Get aggregated counts and percentages
router.get("/:id/results", protect, pollController.getPollResults);

module.exports = router;
