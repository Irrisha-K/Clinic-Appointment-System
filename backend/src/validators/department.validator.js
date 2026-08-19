import Joi from "joi";

const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  description: Joi.string().trim().allow("").optional(),
}).options({ stripUnknown: true });

const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  description: Joi.string().trim().allow("").optional(),
}).options({ stripUnknown: true });

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("active", "inactive").required(),
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

export const validateCreateDepartment = validate(createDepartmentSchema);
export const validateUpdateDepartment = validate(updateDepartmentSchema);
export const validateUpdateStatus = validate(updateStatusSchema);
