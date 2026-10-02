const StudyPartner = require("../models/StudyPartner");
const { catchAsync } = require("../middleware/errorHandler");

exports.getStudyPartners = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.partnerId) filter.partnerId = req.query.partnerId;
  const partners = await StudyPartner.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: partners });
});

exports.getStudyPartner = catchAsync(async (req, res) => {
  const partner = await StudyPartner.findById(req.params.id);
  if (!partner) {
    return res
      .status(404)
      .json({ success: false, message: "Study partner record not found" });
  }
  res.status(200).json({ success: true, data: partner });
});

exports.createStudyPartner = catchAsync(async (req, res) => {
  const partner = await StudyPartner.create({
    ...req.body,
    userId: req.user.id,
  });
  res.status(201).json({ success: true, data: partner });
});

exports.updateStudyPartner = catchAsync(async (req, res) => {
  const existingPartner = await StudyPartner.findById(req.params.id);
  if (!existingPartner) {
    return res
      .status(404)
      .json({
        success: false,
        message: "Study partner record not found",
        errors: [],
      });
  }

  if (
    existingPartner.userId.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this study partner record",
      errors: [],
    });
  }

  const partner = await StudyPartner.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).json({ success: true, data: partner });
});

exports.deleteStudyPartner = catchAsync(async (req, res) => {
  const partner = await StudyPartner.findById(req.params.id);
  if (!partner) {
    return res
      .status(404)
      .json({
        success: false,
        message: "Study partner record not found",
        errors: [],
      });
  }

  if (partner.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this study partner record",
      errors: [],
    });
  }

  await partner.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Study partner record deleted" });
});
