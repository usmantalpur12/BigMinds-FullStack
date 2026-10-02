const express = require("express");
const resourcesController = require("../controllers/resourcesController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", resourcesController.getResources);
router.get("/:id", resourcesController.getResource);

router.use(protect);
router.post("/", resourcesController.createResource);
router.put("/:id", resourcesController.updateResource);
router.delete("/:id", resourcesController.deleteResource);

module.exports = router;
