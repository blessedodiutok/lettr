// HTTP handlers for /api/inquiries

import type { Request, Response } from "express";
import * as inquiriesService from "../services/inquiries.service.js";

const id = (req: Request) => String(req.params.id);
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });

export async function createInquiry(req: Request, res: Response) {
  ok(res, await inquiriesService.createInquiry(req.body, req.user!.id), 201);
}

export async function getMyInquiries(req: Request, res: Response) {
  const status = req.query.status === "closed" ? "closed" : req.query.status === "all" ? undefined : "active";
  const listingId = typeof req.query.listingId === "string" ? req.query.listingId : undefined;
  ok(res, await inquiriesService.getMyInquiries(req.user!.id, req.user!.role, { status, listingId }));
}

export async function getUnreadCount(req: Request, res: Response) {
  ok(res, await inquiriesService.getUnreadCount(req.user!.id));
}

export async function getForListing(req: Request, res: Response) {
  ok(res, await inquiriesService.getInquiryForListing(String(req.params.listingId), req.user!.id));
}

export async function getInquiry(req: Request, res: Response) {
  ok(res, await inquiriesService.getInquiry(id(req), req.user!.id));
}

export async function sendMessage(req: Request, res: Response) {
  ok(res, await inquiriesService.sendMessage(id(req), req.body.message, req.user!.id));
}

export async function closeInquiry(req: Request, res: Response) {
  ok(res, await inquiriesService.closeInquiry(id(req), req.user!.id, req.body?.reason));
}

export async function scheduleInspection(req: Request, res: Response) {
  ok(res, await inquiriesService.scheduleInspection(id(req), req.body, req.user!.id));
}

export async function confirmInspection(req: Request, res: Response) {
  ok(res, await inquiriesService.confirmInspection(id(req), req.user!.id));
}

export async function completeInspection(req: Request, res: Response) {
  ok(res, await inquiriesService.completeInspection(id(req), req.user!.id));
}

export async function makeOffer(req: Request, res: Response) {
  ok(res, await inquiriesService.makeOffer(id(req), req.user!.id, req.body?.note));
}

export async function withdrawOffer(req: Request, res: Response) {
  ok(res, await inquiriesService.withdrawOffer(id(req), req.user!.id));
}

export async function acceptOffer(req: Request, res: Response) {
  ok(res, await inquiriesService.acceptOffer(id(req), req.user!.id));
}

export async function declineOffer(req: Request, res: Response) {
  ok(res, await inquiriesService.declineOffer(id(req), req.user!.id, req.body?.reason));
}
