import TokenCounter from "../models/TokenCounter.js";

const MAX_RETRIES = 3;

/**
 * Atomically assigns the next sequential token number for a given
 * doctor + appointment date. Never decrements, never reuses a number —
 * this is the ONLY function in the system that should ever write to
 * TokenCounter.
 *
 * @param {ObjectId|String} doctorId
 * @param {Date} appointmentDate - ALREADY normalized (UTC midnight).
 *   This function does not parse or re-derive dates — reuse the exact
 *   Date object from the Appointment document / resolved validation step.
 * @returns {Promise<Number>} the newly assigned token number
 */
export const assignNextToken = async (
  doctorId,
  appointmentDate,
  attempt = 0,
) => {
  try {
    const counter = await TokenCounter.findOneAndUpdate(
      { doctor: doctorId, date: appointmentDate },
      { $inc: { lastTokenNumber: 1 } },
      { new: true, upsert: true },
    );

    return counter.lastTokenNumber;
  } catch (err) {
    // E11000: two requests raced to CREATE the counter document for a
    // doctor/date pair that didn't exist yet. The unique index correctly
    // rejected the second insert — retry now finds the just-created
    // document and increments it normally (fully atomic from here on).
    if (err.code === 11000 && attempt < MAX_RETRIES) {
      return assignNextToken(doctorId, appointmentDate, attempt + 1);
    }
    throw err;
  }
};

/**
 * Read-only helper: returns the last issued token number for a doctor/date,
 * or 0 if no tokens have been issued yet. Useful for display purposes
 * (e.g. "3 patients ahead of you") without consuming a token.
 * Does NOT increment anything.
 */
export const getLastIssuedToken = async (doctorId, appointmentDate) => {
  const counter = await TokenCounter.findOne({
    doctor: doctorId,
    date: appointmentDate,
  });
  return counter ? counter.lastTokenNumber : 0;
};
