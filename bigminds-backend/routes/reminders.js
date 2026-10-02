const express = require("express");
const remindersController = require("../controllers/remindersController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", remindersController.getReminders);
router.get("/:id", remindersController.getReminder);

router.use(protect);
router.post("/", remindersController.createReminder);
router.put("/:id", remindersController.updateReminder);
router.delete("/:id", remindersController.deleteReminder);

module.exports = router;
