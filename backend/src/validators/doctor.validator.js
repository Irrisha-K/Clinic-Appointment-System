import Joi from "joi";
import isValidObjectId from "../utils/isValidObjectId.js";

const objectIdValidator = (value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const doctorBaseFields = {
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  department: Joi.string().custom(objectIdValidator).required().messages({
    "any.invalid": "Invalid department ID",
  }),
  qualification: Joi.string().trim().required(),
  specialization: Joi.string().trim().required(),
  experience: Joi.number().min(0).required(),
  consultationFee: Joi.number().min(0).required(),
  biography: Joi.string().trim().allow("").optional(),
  phone: Joi.string()
    .trim()
    .allow("")
    .pattern(/^\d{7,15}$/)
    .optional()
    .messages({ "string.pattern.base": "Please provide a valid phone number" }),
  email: Joi.string().trim().lowercase().allow("").email().optional(),
  profileImage: Joi.string().trim().allow("").optional(),
};

const createDoctorSchema = Joi.object(doctorBaseFields).options({
  stripUnknown: true,
});

const updateDoctorSchema = Joi.object(doctorBaseFields).options({
  stripUnknown: true,
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("active", "inactive", "on_leave").required(),
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

export const validateCreateDoctor = validate(createDoctorSchema);
export const validateUpdateDoctor = validate(updateDoctorSchema);
export const validateUpdateDoctorStatus = validate(updateStatusSchema);
