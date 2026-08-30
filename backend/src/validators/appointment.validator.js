import Joi from "joi";
import Doctor from "../models/Doctor.js";
import Department from "../models/Department.js";
import Appointment from "../models/Appointment.js";
import asyncHandler from "../utils/asyncHandler.js";
import isValidObjectId from "../utils/isValidObjectId.js";
import {
  isValidCalendarDate,
  toUTCMidnight,
  getNepalTodayDateString,
} from "../utils/dateUtils.js";
import { getDoctorAvailability } from "../services/availability.service.js";

const objectIdValidator = (value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const dateStringValidator = (value, helpers) => {
  if (!isValidCalendarDate(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const guestInfoSchema = Joi.object({
  firstName: Joi.string().trim().min(1).required(),
  lastName: Joi.string().trim().min(1).required(),
  age: Joi.number().min(0).required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  phone: Joi.string()
    .trim()
    .pattern(/^\d{7,15}$/)
    .required()
    .messages({ "string.pattern.base": "Please provide a valid phone number" }),
  email: Joi.string().trim().lowercase().email().required(),
  address: Joi.string().trim().min(1).required(),
});

// Metadata-only shape for a future upload step (Part 8) — no file handling
// happens here. Lets the create schema accept the shape without erroring
// once the upload middleware starts populating this field.
const reportFileSchema = Joi.object({
  url: Joi.string().uri().required(),
  originalName: Joi.string().required(),
  fileType: Joi.string()
    .valid("application/pdf", "image/jpeg", "image/png")
    .required(),
});

const createAppointmentSchema = Joi.object({
  department: Joi.string().custom(objectIdValidator).required().messages({
    "any.invalid": "Invalid department ID",
  }),
  doctor: Joi.string().custom(objectIdValidator).required().messages({
    "any.invalid": "Invalid doctor ID",
  }),
  appointmentDate: Joi.string()
    .custom(dateStringValidator)
    .required()
    .messages({
      "any.invalid":
        "Appointment date must be a valid calendar date in YYYY-MM-DD format",
    }),
  symptoms: Joi.string().trim().min(3).required().messages({
    "string.empty": "Please describe your symptoms or reason for visit",
    "string.min": "Please provide a bit more detail about your symptoms",
  }),
  paymentMethod: Joi.string().valid("mock_esewa", "pay_at_clinic").required(),
  guestInfo: guestInfoSchema.optional(),
  reportFile: reportFileSchema.optional(),
  // Deliberately NOT accepted: patientRef, status, tokenNumber, paymentStatus,
  // statusHistory, dayOfWeek — all system-assigned. stripUnknown silently
  // discards anything a client sends for these, same pattern as `role` in
  // auth.validator.js.
}).options({ stripUnknown: true });

export const validateCreateAppointment = (req, res, next) => {
  console.log("CREATE APPOINTMENT BODY:", req.body);
  const { error, value } = createAppointmentSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    const validationError = new Error(message);
    validationError.statusCode = 400;
    return next(validationError);
  }

  req.body = value;
  next();
};

// Must run AFTER optionalAuthenticate (needs req.user, if any) and AFTER
// validateCreateAppointment (needs shape-clean req.body). Performs every
// DB-dependent business rule from the approved design.
export const validateAppointmentBusinessRules = asyncHandler(
  async (req, res, next) => {
    const isAuthenticated = Boolean(req.user);

    // --- 1. Identity: exactly one of patientRef (via auth) / guestInfo ---
    if (isAuthenticated) {
      if (req.user.role !== "patient") {
        const error = new Error(
          "Only patient accounts can book an appointment through this endpoint",
        );
        error.statusCode = 403;
        return next(error);
      }
      if (req.body.guestInfo) {
        const error = new Error(
          "You are logged in — guest information should not be provided",
        );
        error.statusCode = 400;
        return next(error);
      }
    } else if (!req.body.guestInfo) {
      const error = new Error(
        "Guest information is required when booking without an account",
      );
      error.statusCode = 400;
      return next(error);
    }

    // --- 2. Doctor must exist and be active ---
    const doctor = await Doctor.findById(req.body.doctor);
    if (!doctor) {
      const error = new Error("Doctor not found");
      error.statusCode = 404;
      return next(error);
    }
    if (doctor.status !== "active") {
      const error = new Error(
        "Selected doctor is not currently available for booking",
      );
      error.statusCode = 400;
      return next(error);
    }

    // --- 3. Department must exist and be active ---
    const department = await Department.findById(req.body.department);
    if (!department) {
      const error = new Error("Department not found");
      error.statusCode = 404;
      return next(error);
    }
    if (department.status !== "active") {
      const error = new Error(
        "Selected department is not currently available for booking",
      );
      error.statusCode = 400;
      return next(error);
    }

    // --- 4. Doctor must belong to the selected department ---
    if (doctor.department.toString() !== department._id.toString()) {
      const error = new Error(
        "Selected doctor does not belong to the selected department",
      );
      error.statusCode = 400;
      return next(error);
    }

    // --- 5. Date must not be in the past (Nepal calendar date, string compare) ---
    const todayNepal = getNepalTodayDateString();
    if (req.body.appointmentDate < todayNepal) {
      const error = new Error("Appointment date cannot be in the past");
      error.statusCode = 400;
      return next(error);
    }

    // --- 6. Doctor must be scheduled and not on leave for that date ---
    const availability = await getDoctorAvailability(
      doctor,
      req.body.appointmentDate,
    );
    if (!availability.available) {
      const error = new Error(
        availability.reason || "Doctor is not available on this date",
      );
      error.statusCode = 400;
      return next(error);
    }

    // --- 7. Duplicate/conflict check ---
    const normalizedDate = toUTCMidnight(req.body.appointmentDate);
    const identityFilter = isAuthenticated
      ? { patientRef: req.user.id }
      : { "guestInfo.phone": req.body.guestInfo.phone };

    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,
      appointmentDate: normalizedDate,
      status: { $in: ["pending", "confirmed"] },
      ...identityFilter,
    });

    if (existingAppointment) {
      const error = new Error(
        "You already have an active appointment request with this doctor on this date",
      );
      error.statusCode = 409;
      return next(error);
    }

    // Attach resolved documents so the Part 5 controller doesn't re-query them.
    req.resolvedDoctor = doctor;
    req.resolvedDepartment = department;
    req.resolvedAppointmentDate = normalizedDate;
    req.resolvedDayOfWeek = availability.day;

    next();
  },
);
