import Joi from "joi";

export const createLeaveRequestSchema = Joi.object({
  leaveTypeId: Joi.number().integer().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref("startDate")).required(),
  reason: Joi.string().optional().allow(null, ""),
  attachmentUrl: Joi.string().uri().optional().allow(null, ""),
});

export const approveRejectSchema = Joi.object({
  comment: Joi.string().optional().allow(null, ""),
});

export const cancelSchema = Joi.object({
  reason: Joi.string().optional().allow(null, ""),
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
