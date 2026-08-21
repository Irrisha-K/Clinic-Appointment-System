import Doctor from "../models/Doctor.js";
import DoctorSchedule from "../models/DoctorSchedule.js";
import DoctorLeave from "../models/DoctorLeave.js";
import asyncHandler from "../utils/asyncHandler.js";
import isValidObjectId from "../utils/isValidObjectId.js";
import { getDoctorAvailability } from "../services/availability.service.js";
import { DAY_ORDER, isValidCalendarDate } from "../utils/dateUtils.js";

// Runs before every route in schedule.routes.js — loads the doctor once
// and attaches it to req.doctor, so every handler below can trust it exists.
export const verifyDoctorExists = asyncHandler(async (req, res, next) => {
  const { doctorId } = req.params;

  if (!isValidObjectId(doctorId)) {
    const error = new Error("Invalid doctor ID");
    error.statusCode = 400;
    return next(error);
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    return next(error);
  }

  req.doctor = doctor;
  next();
});

// ---------- Weekly Schedule ----------

// @route  POST /api/doctors/:doctorId/schedules
// @access Admin only
export const createSchedule = asyncHandler(async (req, res, next) => {
  const { dayOfWeek } = req.body;

  const existing = await DoctorSchedule.findOne({
    doctor: req.doctor._id,
    dayOfWeek,
  });
  if (existing) {
    const error = new Error(
      `A schedule for ${dayOfWeek} already exists for this doctor`,
    );
    error.statusCode = 409;
    return next(error);
  }

  const schedule = await DoctorSchedule.create({
    ...req.body,
    doctor: req.doctor._id,
  });

  res.status(201).json({
    success: true,
    message: "Schedule created successfully",
    schedule,
  });
});

// @route  GET /api/doctors/:doctorId/schedules
// @access Public
export const getWeeklySchedule = asyncHandler(async (req, res) => {
  const schedules = await DoctorSchedule.find({ doctor: req.doctor._id });

  const sorted = schedules.sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  res.status(200).json({
    success: true,
    doctorId: req.doctor._id,
    count: sorted.length,
    schedule: sorted,
  });
});

// @route  PUT /api/doctors/:doctorId/schedules/:scheduleId
// @access Admin only
export const updateSchedule = asyncHandler(async (req, res, next) => {
  const { scheduleId } = req.params;
  const { dayOfWeek } = req.body;

  const schedule = await DoctorSchedule.findOne({
    _id: scheduleId,
    doctor: req.doctor._id,
  });
  if (!schedule) {
    const error = new Error("Schedule not found");
    error.statusCode = 404;
    return next(error);
  }

  if (dayOfWeek !== schedule.dayOfWeek) {
    const duplicate = await DoctorSchedule.findOne({
      _id: { $ne: schedule._id },
      doctor: req.doctor._id,
      dayOfWeek,
    });
    if (duplicate) {
      const error = new Error(
        `A schedule for ${dayOfWeek} already exists for this doctor`,
      );
      error.statusCode = 409;
      return next(error);
    }
  }

  Object.assign(schedule, req.body);
  await schedule.save();

  res.status(200).json({
    success: true,
    message: "Schedule updated successfully",
    schedule,
  });
});

// @route  PATCH /api/doctors/:doctorId/schedules/:scheduleId/status
// @access Admin only
export const updateScheduleStatus = asyncHandler(async (req, res, next) => {
  const { scheduleId } = req.params;
  const { isActive } = req.body;

  const schedule = await DoctorSchedule.findOne({
    _id: scheduleId,
    doctor: req.doctor._id,
  });
  if (!schedule) {
    const error = new Error("Schedule not found");
    error.statusCode = 404;
    return next(error);
  }

  schedule.isActive = isActive;
  await schedule.save();

  res.status(200).json({
    success: true,
    message: `Schedule marked as ${isActive ? "active" : "inactive"}`,
    schedule,
  });
});

// @route  DELETE /api/doctors/:doctorId/schedules/:scheduleId
// @access Admin only
export const deleteSchedule = asyncHandler(async (req, res, next) => {
  const { scheduleId } = req.params;

  const schedule = await DoctorSchedule.findOne({
    _id: scheduleId,
    doctor: req.doctor._id,
  });
  if (!schedule) {
    const error = new Error("Schedule not found");
    error.statusCode = 404;
    return next(error);
  }

  await DoctorSchedule.findByIdAndDelete(scheduleId);

  res.status(200).json({
    success: true,
    message: "Schedule deleted successfully",
  });
});

// ---------- Leave / Unavailable Dates ----------

// @route  POST /api/doctors/:doctorId/leaves
// @access Admin only
export const addLeave = asyncHandler(async (req, res, next) => {
  const { date, reason } = req.body;
  const normalizedDate = new Date(`${date}T00:00:00.000Z`);

  const existing = await DoctorLeave.findOne({
    doctor: req.doctor._id,
    date: normalizedDate,
  });
  if (existing) {
    const error = new Error(
      "A leave record for this date already exists for this doctor",
    );
    error.statusCode = 409;
    return next(error);
  }

  const leave = await DoctorLeave.create({
    doctor: req.doctor._id,
    date: normalizedDate,
    reason,
  });

  res.status(201).json({
    success: true,
    message: "Leave date added successfully",
    leave,
  });
});

// @route  GET /api/doctors/:doctorId/leaves
// @access Admin only
export const getLeaves = asyncHandler(async (req, res) => {
  const leaves = await DoctorLeave.find({ doctor: req.doctor._id }).sort({
    date: 1,
  });

  res.status(200).json({
    success: true,
    doctorId: req.doctor._id,
    count: leaves.length,
    leaves,
  });
});

// @route  DELETE /api/doctors/:doctorId/leaves/:leaveId
// @access Admin only
export const removeLeave = asyncHandler(async (req, res, next) => {
  const { leaveId } = req.params;

  const leave = await DoctorLeave.findOne({
    _id: leaveId,
    doctor: req.doctor._id,
  });
  if (!leave) {
    const error = new Error("Leave record not found");
    error.statusCode = 404;
    return next(error);
  }

  await DoctorLeave.findByIdAndDelete(leaveId);

  res.status(200).json({
    success: true,
    message: "Leave date removed successfully",
  });
});

// ---------- Availability ----------

// @route  GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD
// @access Public
export const checkAvailability = asyncHandler(async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    const error = new Error("A date query parameter is required (YYYY-MM-DD)");
    error.statusCode = 400;
    return next(error);
  }

  if (!isValidCalendarDate(date)) {
    const error = new Error(
      "Invalid date. Please provide a valid date in YYYY-MM-DD format",
    );
    error.statusCode = 400;
    return next(error);
  }

  const result = await getDoctorAvailability(req.doctor, date);

  res.status(200).json({
    success: true,
    doctorId: req.doctor._id,
    date,
    ...result,
  });
});
