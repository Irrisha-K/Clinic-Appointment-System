import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
} from "../controllers/department.controller.js";
import {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateUpdateStatus,
} from "../validators/department.validator.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.js";

const router = Router();

// Public/guest-friendly reads — role-based filtering happens in the controller
router.get("/", optionalAuthenticate, getDepartments);
router.get("/:id", optionalAuthenticate, getDepartmentById);

// Admin-only writes
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validateCreateDepartment,
  createDepartment,
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validateUpdateDepartment,
  updateDepartment,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin"),
  validateUpdateStatus,
  updateDepartmentStatus,
);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteDepartment);

export default router;
