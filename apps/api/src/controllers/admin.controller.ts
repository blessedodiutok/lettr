// HTTP handlers for /api/admin

import type { Request, Response } from "express";
import * as adminService from "../services/admin.service.js";

type ListQuery = Parameters<typeof adminService.listUsers>[0];

const ok = (res: Response, data: unknown) => res.json({ success: true, data });
const id = (req: Request) => String(req.params.id);
const listQuery = (req: Request) => req.query as unknown as ListQuery;

export async function overview(_req: Request, res: Response) {
  ok(res, await adminService.getOverview());
}

export async function verificationQueue(_req: Request, res: Response) {
  ok(res, await adminService.getVerificationQueue());
}

/** Streams a locally stored document, or redirects to a short-lived signed URL. */
export async function verificationDocument(req: Request, res: Response) {
  const access = await adminService.getVerificationDocumentAccess(id(req), req.user!.id);
  res.setHeader("Cache-Control", "no-store");
  if (access.kind === "url") res.redirect(access.url);
  else res.sendFile(access.filePath);
}

export async function reviewVerification(req: Request, res: Response) {
  ok(res, await adminService.reviewVerification(id(req), req.user!.id, req.body.status, req.body.rejectionReason));
}

export async function users(req: Request, res: Response) {
  ok(res, await adminService.listUsers(listQuery(req)));
}

export async function moderateUser(req: Request, res: Response) {
  ok(res, await adminService.moderateUser(id(req), req.user!.id, req.body.isActive, req.body.reason));
}

export async function listings(req: Request, res: Response) {
  ok(res, await adminService.listListings(listQuery(req)));
}

export async function moderateListing(req: Request, res: Response) {
  ok(res, await adminService.moderateListing(id(req), req.user!.id, req.body.status, req.body.reason));
}

export async function disputes(req: Request, res: Response) {
  ok(res, await adminService.getDisputes(typeof req.query.status === "string" ? req.query.status : undefined));
}

export async function resolveDispute(req: Request, res: Response) {
  ok(res, await adminService.resolveDispute(id(req), req.user!.id, req.body));
}

export async function payments(req: Request, res: Response) {
  ok(res, await adminService.listPayments(listQuery(req)));
}

export async function auditLog(req: Request, res: Response) {
  ok(res, await adminService.listAuditLog(listQuery(req)));
}
