const mongoose = require("mongoose");
const Poll = require("../models/polls");
const Vote = require("../models/vote");

// @desc    Create new poll
// @route   POST /api/polls
// @access  Private
exports.createPoll = async (req, res) => {
  try {
    const {
      title,
      options,
      target_location,
      targetAuthority,
      description,
      category,
      duration,
    } = req.body;
    
    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: "Invalid poll data. Provide title and at least 2 options.",
      });
    }

    const poll = new Poll({
      title,
      description: description || "",
      options,
      category: category || "General",
      duration: duration || 24,
      target_location: target_location || "",
      targetAuthority: targetAuthority || "",
      created_by: req.user._id,
    });
    
    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all polls (with optional filters)
// @route   GET /api/polls
// @access  Private
exports.getAllPolls = async (req, res) => {
  try {
    const q = {};
    if (req.query.target_location) {
      q.target_location = req.query.target_location;
    }
    
    // Return polls newest-first (descending by creation time)
    const polls = await Poll.find(q)
      .populate("created_by", "name email role location")
      .sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Submit a vote to a poll
// @route   POST /api/polls/:id/vote
// @access  Private
exports.submitVote = async (req, res) => {
  try {
    const pollId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({ message: "Invalid poll id" });
    }
    
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if poll has expired
    const createdAt = new Date(poll.createdAt);
    const expiresAt = new Date(
      createdAt.getTime() + poll.duration * 60 * 60 * 1000
    ); // duration is in hours
    if (new Date() > expiresAt) {
      return res.status(400).json({ message: "Poll has expired" });
    }

    const { selected_option } = req.body;
    if (!selected_option || !poll.options.includes(selected_option)) {
      return res.status(400).json({ message: "Invalid option" });
    }

    // Check existing vote
    const exists = await Vote.findOne({
      poll_id: poll._id,
      user_id: req.user._id,
    });
    if (exists) {
      return res.status(409).json({ message: "User already voted on this poll" });
    }

    const vote = new Vote({
      poll_id: poll._id,
      user_id: req.user._id,
      selected_option,
    });
    
    await vote.save();
    res.status(201).json({ message: "Vote recorded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get vote counts for a poll
// @route   GET /api/polls/:id/votes
// @access  Private
exports.getVoteCounts = async (req, res) => {
  try {
    const pollId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({ message: "Invalid poll id" });
    }

    // Get poll to verify it exists and get options
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Get all votes for this poll
    const votes = await Vote.find({ poll_id: pollId });

    // Count votes for each option
    const voteCounts = {};
    poll.options.forEach((option) => {
      voteCounts[option] = votes.filter(
        (vote) => vote.selected_option === option
      ).length;
    });

    res.json({
      total: votes.length,
      votes: voteCounts,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate vote" });
    }
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get aggregated counts and percentages for a poll
// @route   GET /api/polls/:id/results
// @access  Private
exports.getPollResults = async (req, res) => {
  try {
    const pollId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({ message: "Invalid poll id" });
    }
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const agg = await Vote.aggregate([
      { $match: { poll_id: poll._id } },
      { $group: { _id: "$selected_option", count: { $sum: 1 } } },
    ]);

    const counts = {};
    let total = 0;
    agg.forEach((a) => {
      counts[a._id] = a.count;
      total += a.count;
    });

    // Ensure options present
    poll.options.forEach((opt) => {
      if (!counts[opt]) counts[opt] = 0;
    });

    const percentages = {};
    Object.keys(counts).forEach((k) => {
      percentages[k] = total > 0 ? Math.round((counts[k] / total) * 100) : 0;
    });

    // Include whether the requesting user has already voted on this poll
    let userVote = undefined;
    try {
      if (req.user && req.user._id) {
        const userVoteDoc = await Vote.findOne({
          poll_id: poll._id,
          user_id: req.user._id,
        });
        if (userVoteDoc) userVote = userVoteDoc.selected_option;
      }
    } catch (e) {
      console.warn("Failed to determine user vote for poll results", e);
    }

    res.json({ counts, percentages, total, userVote });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
