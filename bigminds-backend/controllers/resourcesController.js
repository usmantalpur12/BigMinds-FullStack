const Resource = require("../models/Resource");
const { catchAsync } = require("../middleware/errorHandler");

exports.getResources = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.owner) filter.owner = req.query.owner;
  const resources = await Resource.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: resources });
});

exports.getResource = catchAsync(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    return res
      .status(404)
      .json({ success: false, message: "Resource not found" });
  }
  res.status(200).json({ success: true, data: resource });
});

exports.createResource = catchAsync(async (req, res) => {
  const resource = await Resource.create({
    ...req.body,
    owner: req.user.id,
  });
  res.status(201).json({ success: true, data: resource });
});

exports.updateResource = catchAsync(async (req, res) => {
  const existingResource = await Resource.findById(req.params.id);
  if (!existingResource) {
    return res
      .status(404)
      .json({ success: false, message: "Resource not found", errors: [] });
  }

  if (
    existingResource.owner.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this resource",
      errors: [],
    });
  }

  const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: resource });
});

exports.deleteResource = catchAsync(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    return res
      .status(404)
      .json({ success: false, message: "Resource not found", errors: [] });
  }

  if (resource.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this resource",
      errors: [],
    });
  }

  await resource.deleteOne();
  res.status(200).json({ success: true, message: "Resource deleted" });
});
