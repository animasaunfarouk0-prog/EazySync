import * as auditLogService from "./auditLog.service.js";

export async function list(req, res, next) {
  try {
    const { module, action, from, to, limit, offset } = req.query;
    const result = await auditLogService.listAuditLogs(req.companyId, {
      module,
      action,
      from,
      to,
      limit,
      offset,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
