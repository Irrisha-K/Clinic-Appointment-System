import transporter from "../config/mailer.js";
import env from "../config/env.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import {
  buildConfirmationEmail,
  buildCancellationEmail,
} from "../utils/emailTemplates.js";
import { toDateString } from "../utils/dateUtils.js";

// Resolves a { email, name } pair for an appointment's patient — registered
// or guest. Returns null if no usable email exists, which callers treat as
// "skip sending, no error."
const resolveRecipient = async (appointment) => {
  if (appointment.patientRef) {
    const user = await User.findById(appointment.patientRef).select(
      "firstName lastName email",
    );
    if (!user || !user.email) return null;
    return { email: user.email, name: `${user.firstName} ${user.lastName}` };
  }

  if (appointment.guestInfo && appointment.guestInfo.email) {
    return {
      email: appointment.guestInfo.email,
      name: `${appointment.guestInfo.firstName} ${appointment.guestInfo.lastName}`,
    };
  }

  return null;
};

// Lowest-level send wrapper. NEVER throws — every possible failure is
// caught here and converted into a logged, returned result. This is the
// guarantee that email sending cannot affect appointment state.
const sendMail = async ({ to, subject, text }) => {
  if (!transporter) {
    console.warn(
      `[email.service] Email disabled (no SMTP config) — skipped sending to ${to}`,
    );
    return { success: false, error: "Email transporter not configured" };
  }

  try {
    await transporter.sendMail({
      from: `"${env.emailFromName}" <${env.emailFromAddress}>`,
      to,
      subject,
      text,
    });
    console.log(
      `[email.service] Email sent successfully to ${to} — "${subject}"`,
    );
    return { success: true };
  } catch (error) {
    console.error(
      `[email.service] Failed to send email to ${to}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
};

/**
 * Sends the appointment confirmation email. Safe to call for both fresh
 * confirmations and rescheduled-then-reconfirmed appointments — the
 * content always reflects whatever is currently on the appointment.
 *
 * @param {Object} appointment - saved Appointment document (post-confirm)
 * @param {Object} doctor - Doctor document (for name + department id)
 * @param {Object} session - { startTime, endTime } from the availability check
 */
export const notifyAppointmentConfirmed = async (
  appointment,
  doctor,
  session,
) => {
  try {
    const recipient = await resolveRecipient(appointment);
    if (!recipient) {
      console.log(
        `[email.service] No email on file for appointment ${appointment._id} — confirmation email skipped`,
      );
      return;
    }

    const department = await Department.findById(doctor.department).select(
      "name",
    );

    const { subject, text } = buildConfirmationEmail({
      patientName: recipient.name,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      departmentName: department ? department.name : "N/A",
      dateString: toDateString(appointment.appointmentDate),
      dayOfWeek: appointment.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      tokenNumber: appointment.tokenNumber,
    });

    await sendMail({ to: recipient.email, subject, text });
  } catch (error) {
    // Defense in depth — sendMail() already never throws, but this
    // guarantees that even a bug elsewhere in this function (e.g. a
    // failed Department lookup) can never bubble up to the caller.
    console.error(
      `[email.service] Unexpected error while preparing confirmation email for appointment ${appointment._id}:`,
      error.message,
    );
  }
};

/**
 * Sends the appointment cancellation email.
 *
 * @param {Object} appointment - saved Appointment document (post-cancel)
 * @param {Object} doctor - Doctor document (for name)
 */
export const notifyAppointmentCancelled = async (appointment, doctor) => {
  try {
    const recipient = await resolveRecipient(appointment);
    if (!recipient) {
      console.log(
        `[email.service] No email on file for appointment ${appointment._id} — cancellation email skipped`,
      );
      return;
    }

    const { subject, text } = buildCancellationEmail({
      patientName: recipient.name,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      dateString: toDateString(appointment.appointmentDate),
      dayOfWeek: appointment.dayOfWeek,
      tokenNumber: appointment.tokenNumber,
      cancelReason: appointment.cancelReason,
    });

    await sendMail({ to: recipient.email, subject, text });
  } catch (error) {
    console.error(
      `[email.service] Unexpected error while preparing cancellation email for appointment ${appointment._id}:`,
      error.message,
    );
  }
};
