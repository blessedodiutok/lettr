// File: apps/api/src/controllers/users.controller.ts
import type { NextFunction, Request, Response } from "express";
import * as usersService from "../services/users.service.js";

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await usersService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await usersService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }
    const result = await usersService.uploadAvatar(req.user!.id, req.file);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getScreeningProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await usersService.getScreeningProfile(
      String(req.params.id),
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}
