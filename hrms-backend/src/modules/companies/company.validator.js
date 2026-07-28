const Joi = require("joi");

const createCompanySchema = Joi.object({
  name: Joi.string().min(1).required(),
  registrationNumber: Joi.string().optional().allow(null, ""),
  industry: Joi.string().optional().allow(null, ""),
  phoneNumber: Joi.string().optional().allow(null, ""),
  email: Joi.string().email().optional().allow(null, ""),
  website: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
});

const updateCompanySchema = Joi.object({
  name: Joi.string().min(1).optional(),
  registrationNumber: Joi.string().optional().allow(null, ""),
  industry: Joi.string().optional().allow(null, ""),
  phoneNumber: Joi.string().optional().allow(null, ""),
  email: Joi.string().email().optional().allow(null, ""),
  website: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
}).min(1); // at least one field must be provided on update

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

module.exports = { createCompanySchema, updateCompanySchema, validate };
