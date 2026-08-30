import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import createError from "../utils/createError.js";
import isValidObjectId from "../utils/isValidObjectId.js";
import {
  isValidCalendarDate,
  toUTCMidnight,
  getNepalTodayDateString,
} from "../utils/dateUtils.js";
import {
  appendHistory,
  confirmAppointmentService,
  cancelAppointmentService,
  rescheduleAppointmentService,
  completeAppointmentService,
  markNoShowService,
  createWalkInService,
} from "../services/appointment.service.js";

const DOCTOR_POPULATE = "firstName lastName specialization";
const DEPARTMENT_POPULATE = "name";
const PATIENT_POPULATE = "firstName lastName phone email";

// ---------- A. Create (patient/guest) ----------
// Relies on validateCreateAppointment + validateAppointmentBusinessRules
// (Part 3) having already run and attached req.resolvedDoctor,
// req.resolvedDepartment, req.resolvedAppointmentDate, req.resolvedDayOfWeek.
export const createAppointment = asyncHandler(async (req, res) => {
  const isAuthenticated = Boolean(req.user);

  const appointment = new Appointment({
    patientRef: isAuthenticated ? req.user.id : null,
    guestInfo: isAuthenticated ? null : req.body.guestInfo,
    department: req.resolvedDepartment._id,
    doctor: req.resolvedDoctor._id,
    appointmentDate: req.resolvedAppointmentDate,
    dayOfWeek: req.resolvedDayOfWeek,
    symptoms: req.body.symptoms,
    reportFile: req.body.reportFile || null,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: req.body.paymentMethod === "mock_esewa" ? "paid" : "pending",
    status: "pending",
    tokenNumber: null,
  });

  appendHistory(appointment, {
    action: "created",
    changedBy: isAuthenticated ? req.user.id : null,
  });

  await appointment.save();

  res.status(201).json({
    success: true,
    message:
      "Appointment request submitted successfully. You will be notified once it is confirmed.",
    appointment,
  });
});

// ---------- B. Patient's own appointments ----------
export const getMyAppointments = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  const filter = { patientRef: req.user.id };
  const todayUTC = toUTCMidnight(getNepalTodayDateString());

  if (status) filter.status = status;

  if (type === "upcoming") {
    filter.appointmentDate = { $gte: todayUTC };
    if (!status) filter.status = { $in: ["pending", "confirmed"] };
  } else if (type === "past") {
    filter.appointmentDate = { $lt: todayUTC };
  }

  const appointments = await Appointment.find(filter)
    .populate("doctor", DOCTOR_POPULATE)
    .populate("department", DEPARTMENT_POPULATE)
    .sort({ appointmentDate: -1, tokenNumber: -1 });

  res
    .status(200)
    .json({ success: true, count: appointments.length, appointments });
});

// ---------- C. Single appointment ----------
export const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("doctor", DOCTOR_POPULATE)
    .populate("department", DEPARTMENT_POPULATE)
    .populate("patientRef", PATIENT_POPULATE);

  if (!appointment) {
    return next(createError("Appointment not found", 404));
  }

  if (req.user.role === "patient") {
    const ownsAppointment =
      appointment.patientRef &&
      appointment.patientRef._id.toString() === req.user.id;
    if (!ownsAppointment) {
      return next(
        createError("You are not authorized to view this appointment", 403),
      );
    }
  }

  res.status(200).json({ success: true, appointment });
});

// ---------- D. Receptionist/Admin — list & filter ----------
export const getAppointments = asyncHandler(async (req, res, next) => {
  const { status, doctor, date } = req.query;
  const filter = {};

  if (status) filter.status = status;

  if (doctor) {
    if (!isValidObjectId(doctor)) {
      return next(createError("Invalid doctor ID", 400));
    }
    filter.doctor = doctor;
  }

  if (date) {
    if (!isValidCalendarDate(date)) {
      return next(createError("Invalid date. Use YYYY-MM-DD format", 400));
    }
    filter.appointmentDate = toUTCMidnight(date);
  }

  const appointments = await Appointment.find(filter)
    .populate("doctor", DOCTOR_POPULATE)
    .populate("department", DEPARTMENT_POPULATE)
    .populate("patientRef", PATIENT_POPULATE)
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json({ success: true, count: appointments.length, appointments });
});

export const getTodayAppointments = asyncHandler(async (req, res, next) => {
  const { doctor } = req.query;
  const filter = {
    appointmentDate: toUTCMidnight(getNepalTodayDateString()),
    status: "confirmed",
  };

  if (doctor) {
    if (!isValidObjectId(doctor)) {
      return next(createError("Invalid doctor ID", 400));
    }
    filter.doctor = doctor;
  }

  const appointments = await Appointment.find(filter)
    .populate("doctor", DOCTOR_POPULATE)
    .populate("patientRef", PATIENT_POPULATE)
    .sort({ tokenNumber: 1 });

  res
    .status(200)
    .json({ success: true, count: appointments.length, appointments });
});

export const searchAppointments = asyncHandler(async (req, res, next) => {
  const { query } = req.query;
  if (!query || query.trim().length < 2) {
    return next(
      createError("Please provide a search term of at least 2 characters", 400),
    );
  }

  const regex = new RegExp(query.trim(), "i");

  const matchingPatients = await User.find({
    role: "patient",
    $or: [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { email: regex },
    ],
  }).select("_id");
  const patientIds = matchingPatients.map((p) => p._id);

  const appointments = await Appointment.find({
    $or: [
      { "guestInfo.firstName": regex },
      { "guestInfo.lastName": regex },
      { "guestInfo.phone": regex },
      { "guestInfo.email": regex },
      { patientRef: { $in: patientIds } },
    ],
  })
    .populate("doctor", DOCTOR_POPULATE)
    .populate("patientRef", PATIENT_POPULATE)
    .sort({ createdAt: -1 })
    .limit(50);

  res
    .status(200)
    .json({ success: true, count: appointments.length, appointments });
});

// ---------- E. Confirm ----------
export const confirmAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(createError("Appointment not found", 404));

  const confirmed = await confirmAppointmentService(appointment, req.user.id);

  res.status(200).json({
    success: true,
    message: "Appointment confirmed successfully",
    appointment: confirmed,
  });
});

// ---------- F. Cancel ----------
export const cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(createError("Appointment not found", 404));

  if (req.user.role === "patient") {
    const ownsAppointment =
      appointment.patientRef &&
      appointment.patientRef.toString() === req.user.id;
    if (!ownsAppointment) {
      return next(
        createError("You are not authorized to cancel this appointment", 403),
      );
    }
  }

  const cancelled = await cancelAppointmentService(appointment, {
    cancelReason: req.body.cancelReason,
    changedBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully",
    appointment: cancelled,
  });
});

// ---------- G. Reschedule ----------
export const rescheduleAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(createError("Appointment not found", 404));

  if (req.user.role === "patient") {
    const ownsAppointment =
      appointment.patientRef &&
      appointment.patientRef.toString() === req.user.id;
    if (!ownsAppointment) {
      return next(
        createError(
          "You are not authorized to reschedule this appointment",
          403,
        ),
      );
    }
    if (req.body.newDoctorId) {
      return next(
        createError(
          "Changing doctor is not permitted when self-rescheduling; please contact the clinic",
          400,
        ),
      );
    }
  }

  const { newAppointmentDate, newDoctorId } = req.body;
  if (!newAppointmentDate) {
    return next(createError("newAppointmentDate is required", 400));
  }

  const rescheduled = await rescheduleAppointmentService(
    appointment,
    { newAppointmentDate, newDoctorId },
    req.user.id,
  );

  res.status(200).json({
    success: true,
    message: "Appointment rescheduled successfully. Awaiting confirmation.",
    appointment: rescheduled,
  });
});

// ---------- H. Complete ----------
export const completeAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(createError("Appointment not found", 404));

  const completed = await completeAppointmentService(appointment, req.user.id);

  res.status(200).json({
    success: true,
    message: "Appointment marked as completed",
    appointment: completed,
  });
});

// ---------- I. No-show ----------
export const markNoShow = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(createError("Appointment not found", 404));

  const updated = await markNoShowService(appointment, req.user.id);

  res.status(200).json({
    success: true,
    message: "Appointment marked as no-show",
    appointment: updated,
  });
});

// ---------- J. Walk-in ----------
export const createWalkIn = asyncHandler(async (req, res) => {
  const appointment = await createWalkInService(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: "Walk-in appointment created and confirmed",
    appointment,
  });
});
