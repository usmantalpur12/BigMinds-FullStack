const express = require("express");
const gamificationsController = require("../controllers/gamificationsController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", gamificationsController.getAllGamifications);
router.get("/:id", gamificationsController.getGamification);

router.use(protect);
router.post(
  "/",
  authorize("admin"),
  gamificationsController.createGamification,
);
router.put(
  "/:id",
  authorize("admin"),
  gamificationsController.updateGamification,
);
router.delete(
  "/:id",
  authorize("admin"),
  gamificationsController.deleteGamification,
);

module.exports = router;
