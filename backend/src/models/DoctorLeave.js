import mongoose from "mongoose";

const doctorLeaveSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    date: {
      type: Date,
      required: [true, "Leave date is required"],
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

// One leave record per doctor per date — database-level safety net
doctorLeaveSchema.index({ doctor: 1, date: 1 }, { unique: true });

const DoctorLeave = mongoose.model("DoctorLeave", doctorLeaveSchema);

export default DoctorLeave;
