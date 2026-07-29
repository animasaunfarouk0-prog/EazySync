export default function tenantMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { companyId, roleName } = req.user;

  if (roleName === "applicant") {
    return res
      .status(403)
      .json({ error: "Applicants cannot access company-scoped resources" });
  }

  if (!companyId) {
    return res
      .status(403)
      .json({ error: "No company associated with this account" });
  }

  req.companyId = companyId;
  next();
}
