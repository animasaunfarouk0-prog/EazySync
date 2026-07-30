import prisma from "../../config/prisma.js";

export async function notify({ userId, type, title, message, relatedEntityType, relatedEntityId }) {
  return prisma.notification.create({
    data: {
      userId,
      type: type || null,
      title: title || null,
      message: message || null,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
    },
  });
}

export async function listNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAsRead(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    const err = new Error("Notification not found");
    err.status = 404;
    throw err;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { message: "All notifications marked as read" };
}
