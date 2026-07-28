const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  companyId: Joi.number().integer().optional(),
  roleName: Joi.string()
    .valid("super_admin", "hr_admin", "manager", "employee", "applicant")
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required(),
});

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

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  googleAuthSchema,
  validate,
};
