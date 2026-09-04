import env from "../config/env.js";

const formatDateDisplay = (dateString, dayOfWeek) =>
  `${dateString} (${dayOfWeek})`;

export const buildConfirmationEmail = ({
  patientName,
  doctorName,
  departmentName,
  dateString,
  dayOfWeek,
  startTime,
  endTime,
  tokenNumber,
}) => {
  const subject = `Appointment Confirmed - Token #${tokenNumber} - ${env.clinicName}`;

  const text = `Dear ${patientName},

Your appointment has been CONFIRMED. Details are below:

Doctor: Dr. ${doctorName}
Department: ${departmentName}
Appointment Date: ${formatDateDisplay(dateString, dayOfWeek)}
Doctor's Working Session: ${startTime} - ${endTime}
Your Token Number: ${tokenNumber}

HOW THE TOKEN SYSTEM WORKS:
Patients are attended in order of their token number during the doctor's
working session shown above. This is NOT your exact individual appointment
time. Please arrive at least 15-20 minutes before the session start time
and wait for your token number to be called.

Clinic: ${env.clinicName}
Address: ${env.clinicAddress}
Phone: ${env.clinicPhone}

If this is a medical emergency, please call the clinic immediately or visit
the nearest emergency department. Online appointments are intended for
non-emergency consultations.

Thank you,
${env.clinicName}`;

  return { subject, text };
};

export const buildCancellationEmail = ({
  patientName,
  doctorName,
  dateString,
  dayOfWeek,
  tokenNumber,
  cancelReason,
}) => {
  const subject = `Appointment Cancelled - ${env.clinicName}`;

  const tokenLine = tokenNumber ? `Token Number: ${tokenNumber}\n` : "";

  const text = `Dear ${patientName},

Your appointment has been CANCELLED. Details are below:

Doctor: Dr. ${doctorName}
Appointment Date: ${formatDateDisplay(dateString, dayOfWeek)}
${tokenLine}Reason: ${cancelReason || "Not specified"}

If you would like to book a new appointment, please visit us again or
contact the clinic directly.

Clinic: ${env.clinicName}
Phone: ${env.clinicPhone}

Thank you,
${env.clinicName}`;

  return { subject, text };
};
