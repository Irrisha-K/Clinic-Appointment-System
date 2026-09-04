import nodemailer from "nodemailer";
import env from "./env.js";

// Built once at startup. If SMTP credentials aren't fully configured,
// transporter stays null and email.service.js treats every send as a
// no-op — the app must keep working without email.
let transporter = null;

if (env.smtpHost && env.smtpUser && env.smtpPass) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465, // true for port 465, false for 587/others
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
} else {
  console.warn(
    "[mailer] SMTP credentials are not fully configured. Email notifications are disabled.",
  );
}

export default transporter;
