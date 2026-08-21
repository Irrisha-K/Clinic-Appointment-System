import { Router } from "express";
import {
  verifyDoctorExists,
  createSchedule,
  getWeeklySchedule,
  updateSchedule,
  updateScheduleStatus,
  deleteSchedule,
  addLeave,
  getLeaves,
  removeLeave,
  checkAvailability,
} from "../controllers/schedule.controller.js";
import {
  validateSchedule,
  validateScheduleStatus,
  validateLeave,
} from "../validators/schedule.validator.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

// mergeParams: true — required so :doctorId from the parent mount
// (in doctor.routes.js) is accessible on req.params here
const router = Router({ mergeParams: true });

// Loads req.doctor for every route in this file
router.use(verifyDoctorExists);

// Weekly schedule
router.post(
  "/schedules",
  authenticate,
  authorizeRoles("admin"),
  validateSchedule,
  createSchedule,
);
router.get("/schedules", getWeeklySchedule);
router.put(
  "/schedules/:scheduleId",
  authenticate,
  authorizeRoles("admin"),
  validateSchedule,
  updateSchedule,
);
router.patch(
  "/schedules/:scheduleId/status",
  authenticate,
  authorizeRoles("admin"),
  validateScheduleStatus,
  updateScheduleStatus,
);
router.delete(
  "/schedules/:scheduleId",
  authenticate,
  authorizeRoles("admin"),
  deleteSchedule,
);

// Leave / unavailable dates
router.post(
  "/leaves",
  authenticate,
  authorizeRoles("admin"),
  validateLeave,
  addLeave,
);
router.get("/leaves", authenticate, authorizeRoles("admin"), getLeaves);
router.delete(
  "/leaves/:leaveId",
  authenticate,
  authorizeRoles("admin"),
  removeLeave,
);

// Availability check
router.get("/availability", checkAvailability);

export default router;
