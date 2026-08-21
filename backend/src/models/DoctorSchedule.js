import mongoose from "mongoose";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    dayOfWeek: {
      type: String,
      enum: {
        values: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        message: "Invalid day of week",
      },
      required: [true, "Day of week is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [TIME_REGEX, "Start time must be in HH:mm 24-hour format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [TIME_REGEX, "End time must be in HH:mm 24-hour format"],
    },
    breakStart: {
      type: String,
      validate: {
        validator: (v) => !v || TIME_REGEX.test(v),
        message: "Break start time must be in HH:mm 24-hour format",
      },
    },
    breakEnd: {
      type: String,
      validate: {
        validator: (v) => !v || TIME_REGEX.test(v),
        message: "Break end time must be in HH:mm 24-hour format",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// One schedule entry per doctor per day — database-level safety net
doctorScheduleSchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });

const DoctorSchedule = mongoose.model("DoctorSchedule", doctorScheduleSchema);

export default DoctorSchedule;
