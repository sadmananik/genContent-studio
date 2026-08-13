function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(error.errors).map((fieldError) => fieldError.message)
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier supplied" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Duplicate value already exists" });
  }

  return res.status(statusCode).json({
    message: error.message || "Internal server error"
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
