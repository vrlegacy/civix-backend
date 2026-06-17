const Petition = require("../models/petition");

// @desc    Add comment to petition
// @route   POST /api/petitions/:id/comment
// @access  Private
exports.commentPetition = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text required" });
    }
    const petition = await Petition.findById(req.params.id);
    if (!petition) {
      return res.status(404).json({ message: "Petition not found" });
    }
    petition.comments.push({ by: req.user._id, text });
    await petition.save();
    res.json({ success: true, comments: petition.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Resolve petition (Admin only)
// @route   PUT /api/petitions/:id/resolve
// @access  Private/Admin
exports.resolvePetition = async (req, res) => {
  try {
    const { comment } = req.body;
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({ message: "Petition not found" });
    }

    petition.status = "resolved";
    petition.resolved = true;

    // Add resolution comment if provided
    if (comment) {
      petition.comments.push({
        by: req.user._id,
        text: comment,
        isResolutionComment: true,
      });
    }

    petition.status_history.push({
      status: "resolved",
      by: req.user._id,
      note: comment || "Petition resolved by admin",
    });

    await petition.save();

    // Populate user info for comments
    await petition.populate("comments.by", "name email role");

    res.json({
      success: true,
      petition,
      message: "Petition resolved successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all petitions (with optional filters)
// @route   GET /api/petitions
// @access  Private
exports.getAllPetitions = async (req, res) => {
  try {
    const filters = {};
    if (req.query.location) filters.location = req.query.location;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.status = req.query.status;
    
    const petitions = await Petition.find(filters).populate(
      "creator assigned_to",
      "name email role"
    );
    
    // Add isSignedByCurrentUser flag for each petition
    const petitionsWithSignedFlag = petitions.map((petition) => {
      const petitionObj = petition.toObject();
      petitionObj.isSignedByCurrentUser = petition.signatures.includes(
        req.user._id
      );
      return petitionObj;
    });
    res.json(petitionsWithSignedFlag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new petition
// @route   POST /api/petitions
// @access  Private
exports.createPetition = async (req, res) => {
  try {
    const {
      title,
      summary,
      description,
      category,
      location,
      targetAuthority,
      signatureGoal,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !targetAuthority) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Create petition document
    const petition = await Petition.create({
      creator: req.user._id,
      title,
      summary,
      description,
      category,
      location,
      targetAuthority,
      signatureGoal: signatureGoal || 100,
      status_history: [{ status: "active", by: req.user._id }],
    });

    res.status(201).json({ success: true, petition });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while creating petition." });
  }
};

// @desc    Sign petition
// @route   POST /api/petitions/:id/sign
// @access  Private
exports.signPetition = async (req, res) => {
  try {
    const p = await Petition.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Petition not found" });

    // Prevent duplicate sign
    if (p.signatures.includes(req.user._id)) {
      return res.status(400).json({ message: "You already signed this petition" });
    }

    p.signatures.push(req.user._id);
    p.signaturesCount = p.signatures.length;
    p.status_history.push({
      status: "signed",
      by: req.user._id,
      note: "User signed petition",
    });
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get local petitions in official's area
// @route   GET /api/petitions/local
// @access  Private
exports.getLocalPetitions = async (req, res) => {
  try {
    const location = req.user.location;
    if (!location) {
      return res.status(400).json({ message: "User has no location set" });
    }
    const petitions = await Petition.find({ location }).populate(
      "creator assigned_to",
      "name email role"
    );
    
    // Add isSignedByCurrentUser flag for each petition
    const petitionsWithSignedFlag = petitions.map((petition) => {
      const petitionObj = petition.toObject();
      petitionObj.isSignedByCurrentUser = petition.signatures.includes(
        req.user._id
      );
      return petitionObj;
    });
    res.json(petitionsWithSignedFlag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get petitions assigned to the volunteer
// @route   GET /api/petitions/volunteer/assigned
// @access  Private/Volunteer
exports.getAssignedPetitions = async (req, res) => {
  try {
    const petitions = await Petition.find({
      assigned_to: req.user._id,
      status: { $in: ["assigned", "under_review"] },
    }).populate("creator assigned_to", "name email role");
    
    // Add isSignedByCurrentUser flag for each petition
    const petitionsWithSignedFlag = petitions.map((petition) => {
      const petitionObj = petition.toObject();
      petitionObj.isSignedByCurrentUser = petition.signatures.includes(
        req.user._id
      );
      return petitionObj;
    });
    res.json(petitionsWithSignedFlag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Assign petition to volunteer
// @route   PUT /api/petitions/:id/assign
// @access  Private/Official/Admin
exports.assignPetition = async (req, res) => {
  try {
    const { assigned_to, note } = req.body;
    const p = await Petition.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Petition not found" });

    p.assigned_to = assigned_to;
    p.status = "assigned";
    p.status_history.push({ status: "assigned", by: req.user._id, note });
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Volunteer updates progress note on assigned petition
// @route   PUT /api/petitions/:id/volunteer-update
// @access  Private/Volunteer/Admin/Official
exports.updatePetitionProgress = async (req, res) => {
  try {
    const { note, status } = req.body;
    const p = await Petition.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Petition not found" });
    
    if (!p.assigned_to || p.assigned_to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    p.status = status || "under_review";
    p.status_history.push({ status: p.status, by: req.user._id, note });
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Official responds to or closes petition
// @route   PUT /api/petitions/:id/respond
// @access  Private/Official/Admin
exports.respondPetition = async (req, res) => {
  try {
    const { official_response, status } = req.body;
    const p = await Petition.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Petition not found" });

    if (official_response) p.official_response = official_response;
    if (status) p.status = status;
    p.status_history.push({
      status: p.status,
      by: req.user._id,
      note: official_response,
    });
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
