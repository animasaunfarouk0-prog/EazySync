const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateApply = (req, res, next) => {
  const { firstName, lastName, email } = req.body
  const errors = [];

  if (!firstName || firstName.trim().length < 5) errors.push("firstName is required");
  if (!lastName || lastName.trim().length < 5) errors.push("lastName is required");
  if (!email || !EMAIL_REGEX.test(email)) errors.push("A valid email is required");
  if (!req.file) errors.push("Resume file is required");

  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  next();
};

export const validateApplicantStatusUpdate = (req, res, next) => {
  const validStatuses = ["new", "in_review", "shortlisted", "interviewed", "offered", "hired", "rejected"];
  if (!req.body.status || !validStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
  }
  next();
};