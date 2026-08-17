import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^\d{7,15}$/, "Please provide a valid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    age: {
      type: Number,
      required: [
        function () {
          return this.role === "patient";
        },
        "Age is required for patients",
      ],
      min: [0, "Age cannot be negative"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be male, female, or other",
      },
      required: [
        function () {
          return this.role === "patient";
        },
        "Gender is required for patients",
      ],
    },
    address: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.role === "patient";
        },
        "Address is required for patients",
      ],
    },
    role: {
      type: String,
      enum: {
        values: ["patient", "receptionist", "admin"],
        message: "Role must be patient, receptionist, or admin",
      },
      required: [true, "Role is required"],
      default: "patient",
    },
  },
  { timestamps: true },
);

// Hash password on document save, only if it was modified

// CHANGE THIS IF SOMETHING DOESNT WORK
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Hash password on findOneAndUpdate / findByIdAndUpdate too —
// pre('save') does NOT fire for these query-based update methods,
// so without this, a password changed via an update query would be stored in plain text.

//THIS TOO
// userSchema.pre("findOneAndUpdate", async function (next) {
//   const update = this.getUpdate();

//   if (update && update.password) {
//     const salt = await bcrypt.genSalt(10);
//     update.password = await bcrypt.hash(update.password, salt);
//     this.setUpdate(update);
//   }

//   next();
// });
userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  if (update && update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }
});

// Defense-in-depth: strip password from any JSON-serialized output,
// even if a query explicitly selected it back in with .select('+password')
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
