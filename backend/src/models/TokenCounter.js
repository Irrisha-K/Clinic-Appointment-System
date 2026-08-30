import mongoose from "mongoose";

// One document per doctor per calendar day. `lastTokenNumber` only ever
// increases (via atomic $inc in the token service, built in a later step) —
// it is never decremented or reset, which is exactly what guarantees
// cancelled tokens are never reused.
const tokenCounterSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      // Same UTC-midnight normalization convention as DoctorLeave —
      // this field should always be set via toUTCMidnight() from
      // utils/dateUtils.js when read/written by the token service.
    },
    lastTokenNumber: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// One counter per doctor per day — also what the atomic upsert in the
// token service relies on to find-or-create safely.
tokenCounterSchema.index({ doctor: 1, date: 1 }, { unique: true });

const TokenCounter = mongoose.model("TokenCounter", tokenCounterSchema);

export default TokenCounter;
