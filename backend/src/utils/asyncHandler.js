// Wraps an async controller so any thrown/rejected error is
// forwarded to the centralized error handler instead of crashing
// or requiring a try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
