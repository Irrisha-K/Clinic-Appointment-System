import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Email — intentionally NOT required at startup; see mailer.js
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFromName: process.env.EMAIL_FROM_NAME || "Clinic",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || "",

  clinicName: process.env.CLINIC_NAME || "The Clinic",
  clinicPhone: process.env.CLINIC_PHONE || "",
  clinicAddress: process.env.CLINIC_ADDRESS || "",
};

if (!env.mongoUri) {
  throw new Error("MONGO_URI is not defined in .env");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is not defined in .env");
}

export default env;
