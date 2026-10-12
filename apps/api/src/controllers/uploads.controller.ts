// File: apps/api/src/controllers/uploads.controller.ts
// HTTP handlers for the uploads domain

import type { NextFunction, Request, Response } from "express";
import * as uploadsService from "../services/uploads.service.js";

export async function uploadPropertyPhotos(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "No files uploaded" });
      return;
    }
    const photos = await uploadsService.uploadPropertyPhotos(
      files,
      String(req.params.propertyId),
      req.user!.id,
    );
    res.status(201).json({ success: true, data: photos });
  } catch (error) {
    next(error);
  }
}

export async function deletePhoto(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await uploadsService.deletePhoto(String(req.params.publicId), req.user!.id);
    res.json({ success: true, message: "Photo deleted" });
  } catch (error) {
    next(error);
  }
}

export async function uploadVerificationDocument(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }
    const doc = await uploadsService.uploadVerificationDocument(
      file,
      req.body.documentType,
      req.body.documentNumber,
      req.user!.id,
    );
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
}
