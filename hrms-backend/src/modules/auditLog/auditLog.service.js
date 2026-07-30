import prisma from "../../config/prisma.js";

export async function logAction({ userId, action, module, details, ipAddress }) {
  return prisma.auditLog.create({
    data: {
      userId: userId || null,
      action: action || null,
      module: module || null,
      details: details || null,
      ipAddress: ipAddress || null,
    },
  });
}

export async function listAuditLogs(companyId, filters = {}) {
  const { module, action, from, to, limit, offset } = filters;

  const where = {
    userId: {
      in: (
        await prisma.user.findMany({
          where: { companyId },
          select: { id: true },
        })
      ).map((u) => u.id),
    },
    ...(module && { module }),
    ...(action && { action }),
    ...(from &&
      to && {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? Number(limit) : 50,
      skip: offset ? Number(offset) : 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
