// File: apps/api/src/controllers/notifications.controller.ts
import type { NextFunction, Request, Response } from "express";
import * as notificationsService from "../services/notifications.service.js";

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await notificationsService.getNotifications(req.user!.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationsService.markRead(String(req.params.id), req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationsService.markAllRead(req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function registerFcmToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationsService.registerFcmToken(req.user!.id, req.body.token);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function unregisterFcmToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationsService.unregisterFcmToken(req.user!.id, req.body.token);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
