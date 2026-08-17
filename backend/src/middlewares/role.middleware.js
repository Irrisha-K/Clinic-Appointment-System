// Usage: authorizeRoles("admin"), authorizeRoles("receptionist", "admin")
// Must be placed AFTER `authenticate` in the route's middleware chain.
export const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const error = new Error(
        "You do not have permission to perform this action",
      );
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
