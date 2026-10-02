const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Routes
router.post("/image", protect, upload.single("image"), uploadController.uploadImage);
router.post("/document", protect, upload.single("document"), uploadController.uploadDocument);
router.post("/video", protect, upload.single("video"), uploadController.uploadVideo);
router.delete("/:filename", protect, uploadController.deleteFile);
router.get("/:filename", uploadController.getFile);

module.exports = router; 