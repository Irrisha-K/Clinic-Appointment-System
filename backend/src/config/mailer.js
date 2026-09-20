import nodemailer from "nodemailer";
import env from "./env.js";

let transporter = null;

if (env.smtpHost && env.smtpUser && env.smtpPass) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
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
