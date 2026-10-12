import type { NextFunction, Request, Response } from "express";
import * as adminService from "../services/admin.service.js";

export async function verificationQueue(_req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.getVerificationQueue() }); } catch (error) { next(error); }
}
export async function reviewVerification(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.reviewVerification(String(req.params.id), req.user!.id, req.body.status, req.body.rejectionReason) }); } catch (error) { next(error); }
}
export async function disputes(_req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.getDisputes() }); } catch (error) { next(error); }
}
export async function resolveDispute(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.resolveDispute(String(req.params.id), req.user!.id, req.body.status, req.body.resolution) }); } catch (error) { next(error); }
}
export async function moderateListing(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.moderateListing(String(req.params.id), req.body.status) }); } catch (error) { next(error); }
}
export async function moderateUser(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.moderateUser(String(req.params.id), req.body.isActive) }); } catch (error) { next(error); }
}
