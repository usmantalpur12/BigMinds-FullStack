// Wrapper to catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || "Server Error";
  error.statusCode = err.statusCode || 500;
  error.errors = error.errors || [];

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = {
      message: "Resource not found",
      statusCode: 404,
      errors: [],
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const duplicateFields = err.keyValue
      ? Object.keys(err.keyValue).map((field) => ({
          field,
          msg: "Duplicate field value entered",
        }))
      : [{ msg: "Duplicate field value entered" }];
    error = {
      message: "Duplicate field value entered",
      statusCode: 400,
      errors: duplicateFields,
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      msg: val.message,
    }));
    error = {
      message: "Validation failed",
      statusCode: 400,
      errors,
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    errors: error.errors || [],
  });
};

module.exports = { errorHandler, catchAsync };
