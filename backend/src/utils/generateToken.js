import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256", // pin explicitly — don't rely on library default
  });
};

export default generateToken;
