import jwt from "jsonwebtoken";
import env from "../config/env.js";

// Like `authenticate`, but never blocks the request.
// If a valid token is present, attaches req.user.
// If missing or invalid, silently proceeds as an unauthenticated (guest) request.
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    req.user = { id: decoded.id, role: decoded.role };
  } catch (err) {
    // invalid/expired token on an optional route — just treat as guest
  }

  next();
};
