// File: apps/api/src/services/notifications.service.ts
// Business logic for notifications
// Uses notifications.repository for all Prisma queries

import { createError } from "../middleware/errorHandler.js";
import * as notificationsRepo from "../repositories/notifications.repository.js";
import * as usersRepo from "../repositories/users.repository.js";

export async function getNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    notificationsRepo.findNotificationsByUser(userId, 50),
    notificationsRepo.countUnread(userId),
  ]);
  return { notifications, unreadCount };
}

export async function markRead(id: string, userId: string) {
  return notificationsRepo.markNotificationRead(id, userId);
}

export async function markAllRead(userId: string) {
  return notificationsRepo.markAllNotificationsRead(userId);
}

export async function registerFcmToken(userId: string, token: string) {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    throw createError("A valid FCM token is required", 400);
  }
  return usersRepo.addFcmToken(userId, token.trim());
}

export async function unregisterFcmToken(userId: string, token: string) {
  return usersRepo.removeFcmToken(userId, token);
}
