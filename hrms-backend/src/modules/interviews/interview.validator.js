const VALID_MODES = ["onsite", "remote", "phone"];
const VALID_STATUSES = ["scheduled", "completed", "cancelled", "rescheduled"];

export const validateCreateInterview = (req, res, next) => {
  const { scheduledAt, mode } = req.body;
  const errors = [];

  if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
    errors.push("scheduledAt is required and must be a valid date");
  }
  if (mode && !VALID_MODES.includes(mode)) {
    errors.push(`mode must be one of: ${VALID_MODES.join(", ")}`);
  }

  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  next();
};

export const validateUpdateInterview = (req, res, next) => {
  const { status, rating, mode } = req.body;
  const errors = [];

  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }
  if (mode && !VALID_MODES.includes(mode)) {
    errors.push(`mode must be one of: ${VALID_MODES.join(", ")}`);
  }
  if (rating !== undefined && (isNaN(rating) || rating < 1 || rating > 5)) {
    errors.push("rating must be a number between 1 and 5");
  }

  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  next();
};