import { Router } from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  deleteDoctor,
} from "../controllers/doctor.controller.js";
import {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateUpdateDoctorStatus,
} from "../validators/doctor.validator.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.js";
import scheduleRoutes from "./schedule.routes.js";

const router = Router();

// Public/guest-friendly reads — role-based filtering happens in the controller
router.get("/", optionalAuthenticate, getDoctors);
router.get("/:id", optionalAuthenticate, getDoctorById);

// Admin-only writes
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validateCreateDoctor,
  createDoctor,
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validateUpdateDoctor,
  updateDoctor,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin"),
  validateUpdateDoctorStatus,
  updateDoctorStatus,
);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteDoctor);

// Nested: schedules, leaves, availability — /api/doctors/:doctorId/...
router.use("/:doctorId", scheduleRoutes);

export default router;
