const express = require("express");
const petitionController = require("../controllers/petitionController");
const { protect, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// Get all petitions (authenticated users)
router.get("/", protect, petitionController.getAllPetitions);

// Create a new petition (citizens, officials, admins)
router.post(
  "/",
  protect,
  authorize("citizen", "admin", "official"),
  petitionController.createPetition
);

// Get local petitions (based on official's location)
router.get(
  "/local",
  protect,
  authorize("official", "admin", "citizen", "volunteer"),
  petitionController.getLocalPetitions
);

// Get assigned petitions for a volunteer
router.get(
  "/volunteer/assigned",
  protect,
  authorize("volunteer"),
  petitionController.getAssignedPetitions
);

// Add comment to petition
router.post(
  "/:id/comment",
  protect,
  authorize("citizen", "admin", "official", "volunteer"),
  petitionController.commentPetition
);

// Resolve petition (admin only)
router.put(
  "/:id/resolve",
  protect,
  authorize("admin"),
  petitionController.resolvePetition
);

// Sign petition
router.post("/:id/sign", protect, petitionController.signPetition);

// Assign petition to volunteer
router.put(
  "/:id/assign",
  protect,
  authorize("official", "admin"),
  petitionController.assignPetition
);

// Volunteer updates progress notes on assigned petition
router.put(
  "/:id/volunteer-update",
  protect,
  authorize("volunteer", "admin", "official"),
  petitionController.updatePetitionProgress
);

// Official responds or closes petition
router.put(
  "/:id/respond",
  protect,
  authorize("official", "admin"),
  petitionController.respondPetition
);

module.exports = router;
