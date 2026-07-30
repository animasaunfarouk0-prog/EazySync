import { logAction } from "../modules/auditLog/auditLog.service.js";

export default function auditLogger(module) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const method = req.method;
      let action = null;

      if (method === "POST") action = "created";
      else if (method === "PATCH") action = "updated";
      else if (method === "DELETE") action = "deleted";

      if (action && res.statusCode < 400 && req.user) {
        logAction({
          userId: req.user.userId,
          action: `${action} ${module}`,
          module,
          details: JSON.stringify({
            path: req.originalUrl,
            params: req.params,
            ...(req.body && Object.keys(req.body).length > 0 && { body: req.body }),
          }),
          ipAddress: req.ip,
        }).catch((err) => console.error("Audit log failed:", err));
      }

      return originalJson(body);
    };
    next();
  };
}
