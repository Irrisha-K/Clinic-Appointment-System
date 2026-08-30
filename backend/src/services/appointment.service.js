import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import createError from "../utils/createError.js";
import isValidObjectId from "../utils/isValidObjectId.js";
import { assignNextToken } from "./token.service.js";
import { getDoctorAvailability } from "./availability.service.js";
import {
  isValidCalendarDate,
  toUTCMidnight,
  toDateString,
  getNepalTodayDateString,
} from "../utils/dateUtils.js";

const RESCHEDULABLE_STATUSES = ["pending", "confirmed"];
const CANCELLABLE_STATUSES = ["pending", "confirmed"];

// Appends a statusHistory entry. Mutates the in-memory document only —
// callers are responsible for calling .save() afterward. Exported so the
// controller's createAppointment can reuse it too (avoids duplicating this
// small piece of logic in two places).
export const appendHistory = (
  appointment,
  {
    action,
    previousDate = null,
    previousToken = null,
    changedBy = null,
    note = null,
  },
) => {
  appointment.statusHistory.push({
    action,
    previousDate,
    previousToken,
    changedBy,
    changedAt: new Date(),
    note,
  });
};

// ---------- Confirm ----------
export const confirmAppointmentService = async (appointment, staffUserId) => {
  if (appointment.status !== "pending") {
    throw createError(
      `Cannot confirm an appointment with status "${appointment.status}"`,
      400,
    );
  }

  const doctor = await Doctor.findById(appointment.doctor);
  if (!doctor) {
    throw createError("Doctor not found", 404);
  }

  // Single reused service call covers doctor-active + scheduled-that-day +
  // not-on-leave all at once — no duplicate status checks here.
  const availability = await getDoctorAvailability(
    doctor,
    toDateString(appointment.appointmentDate),
  );
  if (!availability.available) {
    throw createError(
      availability.reason || "Doctor is not available on this date",
      400,
    );
  }

  // Token acquired BEFORE any mutation — if this throws, the appointment
  // document is untouched and remains exactly "pending".
  const tokenNumber = await assignNextToken(
    doctor._id,
    appointment.appointmentDate,
  );

  appointment.tokenNumber = tokenNumber;
  appointment.status = "confirmed";
  appendHistory(appointment, { action: "confirmed", changedBy: staffUserId });

  await appointment.save();
  return appointment;
};

// ---------- Cancel ----------
export const cancelAppointmentService = async (
  appointment,
  { cancelReason, changedBy },
) => {
  if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
    throw createError(
      `Cannot cancel an appointment with status "${appointment.status}"`,
      400,
    );
  }

  appointment.status = "cancelled";
  appointment.cancelReason = cancelReason || null;
  appendHistory(appointment, {
    action: "cancelled",
    changedBy,
    note: cancelReason || null,
  });
  // tokenNumber intentionally untouched — never cleared, never reused.

  await appointment.save();
  return appointment;
};

// ---------- Reschedule ----------
export const rescheduleAppointmentService = async (
  appointment,
  { newAppointmentDate, newDoctorId },
  changedBy,
) => {
  if (!RESCHEDULABLE_STATUSES.includes(appointment.status)) {
    throw createError(
      `Cannot reschedule an appointment with status "${appointment.status}"`,
      400,
    );
  }

  if (!isValidCalendarDate(newAppointmentDate)) {
    throw createError(
      "New appointment date must be a valid calendar date in YYYY-MM-DD format",
      400,
    );
  }

  if (newAppointmentDate < getNepalTodayDateString()) {
    throw createError("New appointment date cannot be in the past", 400);
  }

  let doctor;
  if (newDoctorId) {
    if (!isValidObjectId(newDoctorId)) {
      throw createError("Invalid doctor ID", 400);
    }
    doctor = await Doctor.findById(newDoctorId);
  } else {
    doctor = await Doctor.findById(appointment.doctor);
  }

  if (!doctor) {
    throw createError("Doctor not found", 404);
  }

  const availability = await getDoctorAvailability(doctor, newAppointmentDate);
  if (!availability.available) {
    throw createError(
      availability.reason || "Doctor is not available on this date",
      400,
    );
  }

  const normalizedNewDate = toUTCMidnight(newAppointmentDate);

  const identityFilter = appointment.patientRef
    ? { patientRef: appointment.patientRef }
    : { "guestInfo.phone": appointment.guestInfo.phone };

  const conflict = await Appointment.findOne({
    _id: { $ne: appointment._id },
    doctor: doctor._id,
    appointmentDate: normalizedNewDate,
    status: { $in: ["pending", "confirmed"] },
    ...identityFilter,
  });
  if (conflict) {
    throw createError(
      "An active appointment already exists for this doctor and date",
      409,
    );
  }

  const previousDate = appointment.appointmentDate;
  const previousToken = appointment.tokenNumber;

  appointment.doctor = doctor._id;
  appointment.department = doctor.department;
  appointment.appointmentDate = normalizedNewDate;
  appointment.dayOfWeek = availability.day;
  appointment.tokenNumber = null;
  appointment.status = "pending";

  appendHistory(appointment, {
    action: "rescheduled",
    previousDate,
    previousToken,
    changedBy,
  });

  await appointment.save();
  return appointment;
};

// ---------- Complete / No-show ----------
export const completeAppointmentService = async (appointment, changedBy) => {
  if (appointment.status !== "confirmed") {
    throw createError(
      `Cannot complete an appointment with status "${appointment.status}"`,
      400,
    );
  }
  appointment.status = "completed";
  appendHistory(appointment, { action: "completed", changedBy });
  await appointment.save();
  return appointment;
};

export const markNoShowService = async (appointment, changedBy) => {
  if (appointment.status !== "confirmed") {
    throw createError(
      `Cannot mark no-show on an appointment with status "${appointment.status}"`,
      400,
    );
  }
  appointment.status = "no_show";
  appendHistory(appointment, { action: "no_show", changedBy });
  await appointment.save();
  return appointment;
};

// ---------- Walk-in ----------
export const createWalkInService = async (payload, staffUserId) => {
  const {
    doctor: doctorId,
    symptoms,
    paymentMethod,
    guestInfo,
    patientRef,
    appointmentDate,
  } = payload;

  if (!doctorId || !isValidObjectId(doctorId)) {
    throw createError("A valid doctor ID is required", 400);
  }
  if (!symptoms || !symptoms.trim()) {
    throw createError(
      "Please describe the patient's symptoms or reason for visit",
      400,
    );
  }
  if (!["mock_esewa", "pay_at_clinic"].includes(paymentMethod)) {
    throw createError(
      "Payment method must be mock_esewa or pay_at_clinic",
      400,
    );
  }
  if (!patientRef && !guestInfo) {
    throw createError(
      "Either an existing patient or guest information is required",
      400,
    );
  }
  if (patientRef && guestInfo) {
    throw createError(
      "Provide either an existing patient or guest information, not both",
      400,
    );
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw createError("Doctor not found", 404);
  }

  const dateString = appointmentDate || getNepalTodayDateString();
  if (!isValidCalendarDate(dateString)) {
    throw createError("Invalid appointment date", 400);
  }
  if (dateString < getNepalTodayDateString()) {
    throw createError("Appointment date cannot be in the past", 400);
  }

  const availability = await getDoctorAvailability(doctor, dateString);
  if (!availability.available) {
    throw createError(
      availability.reason || "Doctor is not available on this date",
      400,
    );
  }

  let resolvedPatientRef = null;
  if (patientRef) {
    if (!isValidObjectId(patientRef)) {
      throw createError("Invalid patient ID", 400);
    }
    const patientUser = await User.findById(patientRef);
    if (!patientUser || patientUser.role !== "patient") {
      throw createError("Patient not found", 404);
    }
    resolvedPatientRef = patientUser._id;
  }

  const normalizedDate = toUTCMidnight(dateString);

  const conflict = await Appointment.findOne({
    doctor: doctor._id,
    appointmentDate: normalizedDate,
    status: { $in: ["pending", "confirmed"] },
    ...(resolvedPatientRef
      ? { patientRef: resolvedPatientRef }
      : { "guestInfo.phone": guestInfo.phone }),
  });
  if (conflict) {
    throw createError(
      "An active appointment already exists for this doctor and date",
      409,
    );
  }

  const appointment = new Appointment({
    patientRef: resolvedPatientRef,
    guestInfo: resolvedPatientRef ? null : guestInfo,
    department: doctor.department,
    doctor: doctor._id,
    appointmentDate: normalizedDate,
    dayOfWeek: availability.day,
    symptoms: symptoms.trim(),
    paymentMethod,
    paymentStatus: paymentMethod === "mock_esewa" ? "paid" : "pending",
    status: "pending", // set to pending first, then confirmed below via the
    // same code path as a normal confirmation-in-memory
  });

  appendHistory(appointment, {
    action: "created",
    changedBy: staffUserId,
    note: "Walk-in appointment created by staff",
  });

  // Token acquired before finalizing "confirmed", same safety ordering as
  // confirmAppointmentService — if this throws, nothing has been saved yet.
  const tokenNumber = await assignNextToken(doctor._id, normalizedDate);

  appointment.tokenNumber = tokenNumber;
  appointment.status = "confirmed";
  appendHistory(appointment, {
    action: "confirmed",
    changedBy: staffUserId,
    note: "Walk-in — confirmed immediately",
  });

  await appointment.save();
  return appointment;
};
