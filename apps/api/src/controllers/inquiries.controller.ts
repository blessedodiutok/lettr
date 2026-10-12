// File: apps/api/src/controllers/inquiries.controller.ts
// HTTP handlers for the inquiries domain

import type { NextFunction, Request, Response } from "express";
import * as inquiriesService from "../services/inquiries.service.js";

export async function createInquiry(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inquiry = await inquiriesService.createInquiry(
      req.body,
      req.user!.id,
    );
    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
}

export async function getMyInquiries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inquiries = await inquiriesService.getMyInquiries(
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, data: inquiries });
  } catch (error) {
    next(error);
  }
}

export async function getInquiry(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inquiry = await inquiriesService.getInquiry(
      String(req.params.id),
      req.user!.id,
    );
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inquiry = await inquiriesService.sendMessage(
      String(req.params.id),
      req.body.message,
      req.user!.id,
    );
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
}

export async function scheduleInspection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inquiry = await inquiriesService.scheduleInspection(
      String(req.params.id),
      req.body,
      req.user!.id,
    );
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inquiry = await inquiriesService.updateStatus(
      String(req.params.id),
      req.body.status,
      req.user!.id,
    );
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
}
