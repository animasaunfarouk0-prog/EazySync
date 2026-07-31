const VALID_STATUSES = ["draft", "open", "on_hold", "closed"];
const VALID_EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "intern"];

export const validateCreateJob = (req, res, next) => {
  const { title, departmentId, employmentType, status } = req.body;
  const errors = [];

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    errors.push("Title is required and must be at least 3 characters");
  }
  if (departmentId !== undefined && isNaN(Number(departmentId))) {
    errors.push("departmentId must be a valid number");
  }
  if (employmentType && !VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
    errors.push(`employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(", ")}`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  next();
};

export const validateJobStatusUpdate = (req, res, next) => {
  if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
  }
  next();
};