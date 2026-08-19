import Department from "../models/Department.js";
import asyncHandler from "../utils/asyncHandler.js";

const CASE_INSENSITIVE = { locale: "en", strength: 2 };

// @route  POST /api/departments
// @access Admin only
export const createDepartment = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  const existing = await Department.findOne({ name }).collation(
    CASE_INSENSITIVE,
  );
  if (existing) {
    const error = new Error("A department with this name already exists");
    error.statusCode = 409;
    return next(error);
  }

  const department = await Department.create({ name, description });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    department,
  });
});

// @route  GET /api/departments
// @access Public (guest-friendly) — active only unless caller is admin
export const getDepartments = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const filter = isAdmin ? {} : { status: "active" };

  const departments = await Department.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: departments.length,
    departments,
  });
});

// @route  GET /api/departments/:id
// @access Public (guest-friendly) — active only unless caller is admin
export const getDepartmentById = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  const isAdmin = req.user?.role === "admin";
  if (!isAdmin && department.status !== "active") {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    department,
  });
});

// @route  PUT /api/departments/:id
// @access Admin only
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  const department = await Department.findById(req.params.id);
  if (!department) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  const nameChanged = name.toLowerCase() !== department.name.toLowerCase();
  if (nameChanged) {
    const duplicate = await Department.findOne({
      _id: { $ne: department._id },
      name,
    }).collation(CASE_INSENSITIVE);

    if (duplicate) {
      const error = new Error("A department with this name already exists");
      error.statusCode = 409;
      return next(error);
    }
  }

  department.name = name;
  // Fall back to the existing value if description wasn't sent —
  // prevents PUT from silently wiping it when omitted.
  department.description =
    description !== undefined ? description : department.description;
  await department.save();

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    department,
  });
});

// @route  PATCH /api/departments/:id/status
// @access Admin only
export const updateDepartmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const department = await Department.findById(req.params.id);
  if (!department) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  department.status = status;
  await department.save();

  res.status(200).json({
    success: true,
    message: `Department marked as ${status}`,
    department,
  });
});

// @route  DELETE /api/departments/:id
// @access Admin only
export const deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    return next(error);
  }

  // NOTE: once the Doctor module exists, add a check here to prevent
  // deleting a department that still has doctors assigned to it.
  await Department.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
  });
});
