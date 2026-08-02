import Joi from "joi";

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "weekly_off",
  "on_leave",
];

export const createAttendanceRecordSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  date: Joi.date().required(),
  status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
  clockIn: Joi.string().optional().allow(null, ""),
  clockOut: Joi.string().optional().allow(null, ""),
});

export const updateAttendanceRecordSchema = Joi.object({
  status: Joi.string().valid(...ATTENDANCE_STATUSES).optional(),
  clockIn: Joi.string().optional().allow(null, ""),
  clockOut: Joi.string().optional().allow(null, ""),
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
