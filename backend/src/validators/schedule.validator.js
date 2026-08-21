import Joi from "joi";
import { isValidCalendarDate } from "../utils/dateUtils.js";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeMessage = (label) => ({
  "string.pattern.base": `${label} must be in HH:mm 24-hour format`,
});

const validateTimeLogic = (value, helpers) => {
  const { startTime, endTime, breakStart, breakEnd } = value;

  if (endTime <= startTime) {
    return helpers.message("End time must be after start time");
  }

  const hasBreakStart = Boolean(breakStart);
  const hasBreakEnd = Boolean(breakEnd);

  if (hasBreakStart !== hasBreakEnd) {
    return helpers.message(
      "Both breakStart and breakEnd must be provided together",
    );
  }

  if (hasBreakStart && hasBreakEnd) {
    if (breakEnd <= breakStart) {
      return helpers.message("Break end time must be after break start time");
    }
    if (breakStart < startTime || breakEnd > endTime) {
      return helpers.message("Break time must fall within the working hours");
    }
  }

  return value;
};

const scheduleSchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid(...DAYS)
    .required(),
  startTime: Joi.string()
    .pattern(TIME_REGEX)
    .required()
    .messages(timeMessage("Start time")),
  endTime: Joi.string()
    .pattern(TIME_REGEX)
    .required()
    .messages(timeMessage("End time")),
  breakStart: Joi.string()
    .pattern(TIME_REGEX)
    .allow("")
    .optional()
    .messages(timeMessage("Break start time")),
  breakEnd: Joi.string()
    .pattern(TIME_REGEX)
    .allow("")
    .optional()
    .messages(timeMessage("Break end time")),
  isActive: Joi.boolean().optional(),
})
  .custom(validateTimeLogic)
  .options({ stripUnknown: true });

const scheduleStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
}).options({ stripUnknown: true });

const leaveSchema = Joi.object({
  date: Joi.string()
    .custom((value, helpers) => {
      if (!isValidCalendarDate(value)) {
        return helpers.message(
          "Please provide a valid calendar date in YYYY-MM-DD format",
        );
      }
      return value;
    })
    .required(),
  reason: Joi.string().trim().allow("").optional(),
}).options({ stripUnknown: true });

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    const validationError = new Error(message);
    validationError.statusCode = 400;
    return next(validationError);
  }

  req.body = value;
  next();
};

export const validateSchedule = validate(scheduleSchema);
export const validateScheduleStatus = validate(scheduleStatusSchema);
export const validateLeave = validate(leaveSchema);
