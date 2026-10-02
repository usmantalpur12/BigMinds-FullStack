const Gamification = require("../models/Gamification");
const { catchAsync } = require("../middleware/errorHandler");

exports.getAllGamifications = catchAsync(async (req, res) => {
  const query = { isActive: true };
  if (req.query.type) {
    query.type = req.query.type;
  }
  const gamifications = await Gamification.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: gamifications });
});

exports.getGamification = catchAsync(async (req, res) => {
  const gamification = await Gamification.findById(req.params.id);
  if (!gamification) {
    return res
      .status(404)
      .json({ success: false, message: "Gamification item not found" });
  }
  res.status(200).json({ success: true, data: gamification });
});

exports.createGamification = catchAsync(async (req, res) => {
  const gamification = await Gamification.create(req.body);
  res.status(201).json({ success: true, data: gamification });
});

exports.updateGamification = catchAsync(async (req, res) => {
  const gamification = await Gamification.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!gamification) {
    return res
      .status(404)
      .json({ success: false, message: "Gamification item not found" });
  }
  res.status(200).json({ success: true, data: gamification });
});

exports.deleteGamification = catchAsync(async (req, res) => {
  const gamification = await Gamification.findByIdAndDelete(req.params.id);
  if (!gamification) {
    return res
      .status(404)
      .json({ success: false, message: "Gamification item not found" });
  }
  res.status(200).json({ success: true, message: "Gamification item deleted" });
});
