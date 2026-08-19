import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      minlength: [2, "Department name must be at least 2 characters long"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },
  },
  { timestamps: true },
);

// Case-insensitive uniqueness at the database level — the real safety net
// against duplicates like "Cardiology" vs "cardiology", including race
// conditions between two near-simultaneous create requests.
departmentSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

const Department = mongoose.model("Department", departmentSchema);

export default Department;
