// Handles requests to routes that don't exist
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Centralized error handler — every thrown/forwarded error ends up here
export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
