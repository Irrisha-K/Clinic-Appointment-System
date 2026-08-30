import { Router } from "express";
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  getAppointments,
  getTodayAppointments,
  searchAppointments,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
  createWalkIn,
} from "../controllers/appointment.controller.js";
import {
  validateCreateAppointment,
  validateAppointmentBusinessRules,
} from "../validators/appointment.validator.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.js";

const router = Router();

// ---------- Patient / Guest — create ----------
// optionalAuthenticate: attaches req.user if a valid token is present,
// but never blocks — this is what allows both guest and logged-in patient
// bookings through the same endpoint. Role/guest-info consistency is
// enforced inside validateAppointmentBusinessRules (Part 3), not here.
router.post(
  "/",
  optionalAuthenticate,
  validateCreateAppointment,
  validateAppointmentBusinessRules,
  createAppointment,
);

// ---------- Patient — own history ----------
// Declared BEFORE "/:id" — these are literal path segments and would be
// shadowed by the :id wildcard if ordered after it.
router.get("/my", authenticate, authorizeRoles("patient"), getMyAppointments);

// ---------- Receptionist / Admin — list & lookup ----------
// Also declared before "/:id" for the same reason.
router.get(
  "/today",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  getTodayAppointments,
);
router.get(
  "/search",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  searchAppointments,
);
router.get(
  "/",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  getAppointments,
);

// ---------- Receptionist / Admin — walk-in ----------
// POST, so no collision risk with the GET "/:id" route below, but kept
// grouped with the other action routes for clarity.
router.post(
  "/walk-in",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  createWalkIn,
);

// ---------- Shared — single appointment ----------
// authenticate only (any role); ownership narrowing for patients happens
// inside getAppointmentById itself (Part 5).
router.get("/:id", authenticate, getAppointmentById);

// ---------- Shared — cancel / reschedule ----------
// authenticate only; patient-owns-this-appointment and the
// patient-cannot-change-doctor rule are enforced inside the controller,
// since they depend on the appointment's data, not just the caller's role.
router.patch("/:id/cancel", authenticate, cancelAppointment);
router.patch("/:id/reschedule", authenticate, rescheduleAppointment);

// ---------- Receptionist / Admin — status transitions ----------
router.patch(
  "/:id/confirm",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  confirmAppointment,
);
router.patch(
  "/:id/complete",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  completeAppointment,
);
router.patch(
  "/:id/no-show",
  authenticate,
  authorizeRoles("receptionist", "admin"),
  markNoShow,
);

export default router;
