import Joi from "joi";

export const createGoalSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  goalOwnerId: Joi.number().integer().optional().allow(null),
  departmentId: Joi.number().integer().optional().allow(null),
  title: Joi.string().min(1).required(),
  category: Joi.string().optional().allow(null, ""),
  description: Joi.string().optional().allow(null, ""),
  weight: Joi.number().precision(2).min(0).max(100).optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
  status: Joi.string()
    .valid("on_track", "at_risk", "completed", "overdue")
    .optional(),
  progress: Joi.number().precision(2).min(0).max(100).optional(),
  year: Joi.number().integer().required(),
});

export const updateGoalSchema = Joi.object({
  title: Joi.string().min(1).optional(),
  category: Joi.string().optional().allow(null, ""),
  description: Joi.string().optional().allow(null, ""),
  weight: Joi.number().precision(2).min(0).max(100).optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
  status: Joi.string()
    .valid("on_track", "at_risk", "completed", "overdue")
    .optional(),
  progress: Joi.number().precision(2).min(0).max(100).optional(),
}).min(1);

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}
