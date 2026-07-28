function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { roleName } = req.user;

    if (!allowedRoles.includes(roleName)) {
      return res.status(403).json({
        error: `Access denied. Requires one of: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

function requireSelfOrRole(allowedRoles = [], paramKey = "id") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { roleName, employeeId } = req.user;
    const targetId = Number(req.params[paramKey]);

    const isSelf = employeeId && employeeId === targetId;
    const hasRole = allowedRoles.includes(roleName);

    if (!isSelf && !hasRole) {
      return res.status(403).json({
        error: `Access denied. Requires self-ownership or one of: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    req.isSelfAccess = isSelf && !hasRole;

    next();
  };
}

module.exports = { requireRole, requireSelfOrRole };
