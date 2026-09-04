import mongoose from "mongoose";

const guestInfoSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{7,15}$/, "Please provide a valid phone number"],
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    address: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const reportFileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "confirmed",
        "cancelled",
        "rescheduled",
        "completed",
        "no_show",
      ],
      required: true,
    },
    previousDate: { type: Date, default: null },
    previousToken: { type: Number, default: null },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null when patient/guest-initiated (e.g. initial creation)
    },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: null },
  },
  { _id: false },
);

const appointmentSchema = new mongoose.Schema(
  {
    // Exactly one of these two is populated — enforced in application-level
    // validation (validators/controller), not at the schema level, since
    // Mongoose doesn't have a clean native "exactly one of" constraint.
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestInfo: {
      type: guestInfoSchema,
      default: null,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },

    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      // UTC-midnight-normalized, same convention as DoctorLeave/TokenCounter
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
      // Denormalized at creation/reschedule time from appointmentDate —
      // avoids recomputing on every read and stays historically accurate.
    },

    symptoms: {
      type: String,
      required: [true, "Please describe your symptoms or reason for visit"],
      trim: true,
    },
    reportFile: {
      type: reportFileSchema,
      default: null,
    },

    tokenNumber: {
      type: Number,
      default: null,
      min: 1,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed", "no_show"],
        message:
          "Status must be pending, confirmed, cancelled, completed, or no_show",
      },
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: {
        values: ["mock_esewa", "pay_at_clinic"],
        message: "Payment method must be mock_esewa or pay_at_clinic",
      },
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["not_required", "pending", "paid"],
        message: "Invalid payment status",
      },
      default: "pending",
    },

    cancelReason: {
      type: String,
      default: null,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true },
);

// Receptionist's "today's appointments" / pending-queue views
appointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });

// Hard database-level guarantee against duplicate tokens for the same
// doctor/date — partial index so it only applies once a token is actually
// assigned (many pending/rescheduled-to-pending appointments legitimately
// share tokenNumber: null at the same time).
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, tokenNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { tokenNumber: { $type: "number" } },
  },
);

// Registered patient's own upcoming/history queries
appointmentSchema.index({ patientRef: 1, appointmentDate: -1 });

// Receptionist search by guest phone
appointmentSchema.index({ "guestInfo.phone": 1 });

// Pending queue sorted oldest-first
appointmentSchema.index({ status: 1, createdAt: -1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
