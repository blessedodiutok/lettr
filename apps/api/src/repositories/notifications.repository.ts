// File: apps/api/src/repositories/notifications.repository.ts
// All Prisma queries for the notifications domain
// This repository is used by every other service that needs to
// create in-app notifications — payments, inquiries, tenancy, etc.

import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  return prisma.notification.create({
    // Use UncheckedCreateInput — accepts scalar userId directly
    // instead of requiring a nested user: { connect: { id } } relation object
    data: data as Prisma.NotificationUncheckedCreateInput,
  });
}

export async function findNotificationsByUser(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
