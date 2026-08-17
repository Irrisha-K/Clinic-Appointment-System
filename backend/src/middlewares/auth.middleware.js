import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Not authorized, no token provided");
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  try {
    // Explicitly restrict accepted algorithms — prevents algorithm
    // confusion/downgrade attacks against jwt.verify
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    let message = "Not authorized, invalid token";
    if (err.name === "TokenExpiredError") {
      message = "Session expired, please log in again";
    }
    const error = new Error(message);
    error.statusCode = 401;
    next(error);
  }
};
