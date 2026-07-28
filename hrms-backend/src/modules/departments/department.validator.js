const Joi = require("joi");

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(1).required(),
  headId: Joi.number().integer().optional().allow(null),
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  headId: Joi.number().integer().optional().allow(null),
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

module.exports = { createDepartmentSchema, updateDepartmentSchema, validate };
