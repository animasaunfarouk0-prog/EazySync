const Joi = require("joi");

const createEmployeeSchema = Joi.object({
  userId: Joi.number().integer().required(),
  departmentId: Joi.number().integer().optional().allow(null),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  dateOfBirth: Joi.date().optional().allow(null),
  gender: Joi.string().optional().allow(null, ""),
  maritalStatus: Joi.string().optional().allow(null, ""),
  nationality: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
  phoneNumber: Joi.string().optional().allow(null, ""),
  position: Joi.string().optional().allow(null, ""),
  employmentType: Joi.string()
    .valid("full_time", "part_time", "contract", "intern")
    .optional(),
  dateOfJoining: Joi.date().optional().allow(null),
  reportsToId: Joi.number().integer().optional().allow(null),
  emergencyContactName: Joi.string().optional().allow(null, ""),
  emergencyContactPhone: Joi.string().optional().allow(null, ""),
});

const updateEmployeeSchema = Joi.object({
  departmentId: Joi.number().integer().optional().allow(null),
  firstName: Joi.string().min(1).optional(),
  lastName: Joi.string().min(1).optional(),
  dateOfBirth: Joi.date().optional().allow(null),
  gender: Joi.string().optional().allow(null, ""),
  maritalStatus: Joi.string().optional().allow(null, ""),
  nationality: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
  phoneNumber: Joi.string().optional().allow(null, ""),
  position: Joi.string().optional().allow(null, ""),
  employmentType: Joi.string()
    .valid("full_time", "part_time", "contract", "intern")
    .optional(),
  dateOfJoining: Joi.date().optional().allow(null),
  reportsToId: Joi.number().integer().optional().allow(null),
  status: Joi.string().valid("active", "inactive", "exited").optional(),
  emergencyContactName: Joi.string().optional().allow(null, ""),
  emergencyContactPhone: Joi.string().optional().allow(null, ""),
}).min(1);

const selfUpdateEmployeeSchema = Joi.object({
  phoneNumber: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
  emergencyContactName: Joi.string().optional().allow(null, ""),
  emergencyContactPhone: Joi.string().optional().allow(null, ""),
}).min(1);

function validate(schema) {
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

// Picks the right schema at request time based on req.isSelfAccess, which
// rbac.middleware's requireSelfOrRole sets earlier in the chain.
function validateUpdate(req, res, next) {
  const schema = req.isSelfAccess
    ? selfUpdateEmployeeSchema
    : updateEmployeeSchema;
  return validate(schema)(req, res, next);
}

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  selfUpdateEmployeeSchema,
  validate,
  validateUpdate,
};
