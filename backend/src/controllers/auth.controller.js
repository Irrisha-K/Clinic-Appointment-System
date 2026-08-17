import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route  POST /api/auth/register
// @access Public — patient self-registration only
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, password, age, gender, address } =
    req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    const error = new Error(
      existingUser.email === email
        ? "An account with this email already exists"
        : "An account with this phone number already exists",
    );
    error.statusCode = 409;
    return next(error);
  }

  // role is hardcoded here — never taken from req.body, regardless of
  // what the validator let through
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    age,
    gender,
    address,
    role: "patient",
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    user, // password excluded automatically via toJSON transform
  });
});

// @route  POST /api/auth/login
// @access Public — patient, receptionist, admin
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    return next(error);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    return next(error);
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: "Login successful",
    user,
    token,
  });
});

// @route  GET /api/auth/me
// @access Protected — any authenticated role
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    user,
  });
});
