import DoctorSchedule from "../models/DoctorSchedule.js";
import DoctorLeave from "../models/DoctorLeave.js";
import {
  toUTCMidnight,
  getDayOfWeekFromDateString,
} from "../utils/dateUtils.js";

/**
 * Determines whether a doctor is available on a given calendar date.
 * Assumes `dateString` has ALREADY been validated (see schedule.controller.js) —
 * this service focuses purely on business/availability logic, not input shape.
 *
 * Check order matches spec exactly:
 * 1. Doctor active
 * 2 & 4. Doctor has an ACTIVE working schedule for that day (combined into one query)
 * 3. Doctor is not on leave for that specific date
 */
export const getDoctorAvailability = async (doctor, dateString) => {
  if (doctor.status !== "active") {
    return { available: false, reason: "Doctor is not currently active" };
  }

  const dayOfWeek = getDayOfWeekFromDateString(dateString);

  const schedule = await DoctorSchedule.findOne({
    doctor: doctor._id,
    dayOfWeek,
    isActive: true,
  });

  if (!schedule) {
    return {
      available: false,
      reason: "Doctor is not scheduled to work on this day",
      day: dayOfWeek,
    };
  }

  const targetDate = toUTCMidnight(dateString);
  const leave = await DoctorLeave.findOne({
    doctor: doctor._id,
    date: targetDate,
  });

  if (leave) {
    return {
      available: false,
      reason: "Doctor is on leave on this date",
      day: dayOfWeek,
    };
  }

  return {
    available: true,
    day: dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    breakStart: schedule.breakStart || null,
    breakEnd: schedule.breakEnd || null,
  };
};
