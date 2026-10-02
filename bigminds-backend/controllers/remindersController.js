const Reminder = require("../models/Reminder");
const { catchAsync } = require("../middleware/errorHandler");

exports.getReminders = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === "admin" && req.query.userId) {
    filter.userId = req.query.userId;
  } else {
    filter.userId = req.user.id;
  }
  if (req.query.isCompleted)
    filter.isCompleted = req.query.isCompleted === "true";
  const reminders = await Reminder.find(filter).sort({ remindAt: 1 });
  res.status(200).json({ success: true, data: reminders });
});

exports.getReminder = catchAsync(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) {
    return res
      .status(404)
      .json({ success: false, message: "Reminder not found", errors: [] });
  }

  if (reminder.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this reminder",
      errors: [],
    });
  }

  res.status(200).json({ success: true, data: reminder });
});

exports.createReminder = catchAsync(async (req, res) => {
  const reminder = await Reminder.create({
    ...req.body,
    userId: req.user.id,
  });
  res.status(201).json({ success: true, data: reminder });
});

exports.updateReminder = catchAsync(async (req, res) => {
  const existingReminder = await Reminder.findById(req.params.id);
  if (!existingReminder) {
    return res
      .status(404)
      .json({ success: false, message: "Reminder not found", errors: [] });
  }

  if (
    existingReminder.userId.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this reminder",
      errors: [],
    });
  }

  const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: reminder });
});

exports.deleteReminder = catchAsync(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) {
    return res
      .status(404)
      .json({ success: false, message: "Reminder not found", errors: [] });
  }

  if (reminder.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this reminder",
      errors: [],
    });
  }

  await reminder.deleteOne();
  res.status(200).json({ success: true, message: "Reminder deleted" });
});
