import Joi from "joi";

const registerSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string()
    .trim()
    .pattern(/^\d{7,15}$/)
    .required()
    .messages({ "string.pattern.base": "Please provide a valid phone number" }),
  password: Joi.string().min(6).required(),
  age: Joi.number().min(0).required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  address: Joi.string().trim().required(),
}).options({ stripUnknown: true });

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
}).options({ stripUnknown: true }); // aligned with registerSchema for consistent behavior

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

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
