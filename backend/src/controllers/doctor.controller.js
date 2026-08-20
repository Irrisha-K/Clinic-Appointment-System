import Doctor from "../models/Doctor.js";
import Department from "../models/Department.js";
import asyncHandler from "../utils/asyncHandler.js";
import isValidObjectId from "../utils/isValidObjectId.js";

const DEPARTMENT_FIELDS = "name status";

// @route  POST /api/doctors
// @access Admin only
export const createDoctor = asyncHandler(async (req, res, next) => {
  const { department } = req.body;

  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  const doctor = await Doctor.create(req.body);
  await doctor.populate("department", DEPARTMENT_FIELDS);

  res.status(201).json({
    success: true,
    message: "Doctor created successfully",
    doctor,
  });
});

// @route  GET /api/doctors
// @access Public (guest-friendly) — active only unless caller is admin
// Supports ?department=<departmentId>
export const getDoctors = asyncHandler(async (req, res, next) => {
  const isAdmin = req.user?.role === "admin";
  const filter = isAdmin ? {} : { status: "active" };

  if (req.query.department) {
    if (!isValidObjectId(req.query.department)) {
      const error = new Error("Invalid department ID");
      error.statusCode = 400;
      return next(error);
    }
    filter.department = req.query.department;
  }

  const doctors = await Doctor.find(filter)
    .populate("department", DEPARTMENT_FIELDS)
    .sort({ firstName: 1 });

  res.status(200).json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

// @route  GET /api/doctors/:id
// @access Public (guest-friendly) — active only unless caller is admin
export const getDoctorById = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).populate(
    "department",
    DEPARTMENT_FIELDS,
  );

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    return next(error);
  }

  const isAdmin = req.user?.role === "admin";
  if (!isAdmin && doctor.status !== "active") {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    doctor,
  });
});

// @route  PUT /api/doctors/:id
// @access Admin only
export const updateDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    return next(error);
  }

  const departmentExists = await Department.findById(req.body.department);
  if (!departmentExists) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  Object.assign(doctor, req.body);
  await doctor.save();
  await doctor.populate("department", DEPARTMENT_FIELDS);

  res.status(200).json({
    success: true,
    message: "Doctor updated successfully",
    doctor,
  });
});

// @route  PATCH /api/doctors/:id/status
// @access Admin only
export const updateDoctorStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    return next(error);
  }

  doctor.status = status;
  await doctor.save();
  await doctor.populate("department", DEPARTMENT_FIELDS);

  res.status(200).json({
    success: true,
    message: `Doctor marked as ${status}`,
    doctor,
  });
});

// @route  DELETE /api/doctors/:id
// @access Admin only
export const deleteDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    return next(error);
  }

  // NOTE: once DoctorSchedule/Appointment modules exist, add checks here
  // to prevent deleting a doctor with active schedules or appointments.
  await Doctor.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Doctor deleted successfully",
  });
});
