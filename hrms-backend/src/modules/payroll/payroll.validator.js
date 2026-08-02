import Joi from "joi";

export const createSalaryStructureSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  basicSalary: Joi.number().min(0).required(),
  housingAllowance: Joi.number().min(0).optional().default(0),
  transportAllowance: Joi.number().min(0).optional().default(0),
  otherAllowance: Joi.number().min(0).optional().default(0),
  pensionRate: Joi.number().min(0).max(100).optional().default(8),
  taxRate: Joi.number().min(0).max(100).optional().allow(null),
  nhfRate: Joi.number().min(0).max(100).optional().default(2.5),
  effectiveFrom: Joi.date().required(),
});

export const updateSalaryStructureSchema = Joi.object({
  basicSalary: Joi.number().min(0).optional(),
  housingAllowance: Joi.number().min(0).optional(),
  transportAllowance: Joi.number().min(0).optional(),
  otherAllowance: Joi.number().min(0).optional(),
  pensionRate: Joi.number().min(0).max(100).optional(),
  taxRate: Joi.number().min(0).max(100).optional().allow(null),
  nhfRate: Joi.number().min(0).max(100).optional(),
  effectiveFrom: Joi.date().optional(),
}).min(1);

export const runPayrollSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

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
