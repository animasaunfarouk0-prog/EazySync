import * as notificationService from "./notification.service.js";

export async function list(req, res, next) {
  try {
    const notifications = await notificationService.listNotifications(
      req.user.userId
    );
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notificationId = Number(req.params.id);
    const notification = await notificationService.markAsRead(
      req.user.userId,
      notificationId
    );
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
