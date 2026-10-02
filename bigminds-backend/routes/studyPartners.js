const express = require("express");
const studyPartnerController = require("../controllers/studyPartnerController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", studyPartnerController.getStudyPartners);
router.get("/:id", studyPartnerController.getStudyPartner);

router.use(protect);
router.post("/", studyPartnerController.createStudyPartner);
router.put("/:id", studyPartnerController.updateStudyPartner);
router.delete("/:id", studyPartnerController.deleteStudyPartner);

module.exports = router;
