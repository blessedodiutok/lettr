// HTTP handlers for /api/uploads

import type { Request, Response } from "express";
import * as uploadsService from "../services/uploads.service.js";

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });

export async function uploadPropertyPhotos(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    res.status(400).json({ success: false, error: "Choose at least one photo." });
    return;
  }
  ok(res, await uploadsService.uploadPropertyPhotos(files, String(req.params.propertyId), req.user!.id), 201);
}

export async function reorderPhotos(req: Request, res: Response) {
  ok(res, await uploadsService.reorderPhotos(String(req.params.propertyId), req.body.photoIds, req.user!.id));
}

export async function deletePhoto(req: Request, res: Response) {
  ok(res, await uploadsService.deletePhoto(String(req.params.photoId), req.user!.id));
}

export async function uploadVerificationDocument(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ success: false, error: "Choose a file to upload." });
    return;
  }
  ok(res, await uploadsService.uploadVerificationDocument(req.file, req.body.documentType, req.body.documentNumber, req.user!.id), 201);
}

export async function getMyDocuments(req: Request, res: Response) {
  ok(res, await uploadsService.getMyVerificationDocuments(req.user!.id));
}
