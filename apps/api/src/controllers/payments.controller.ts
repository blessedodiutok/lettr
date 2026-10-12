// HTTP handlers for /api/payments

import type { Request, Response } from "express";
import * as paymentsService from "../services/payments.service.js";

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const id = (req: Request) => String(req.params.id);

export async function initiatePayment(req: Request, res: Response) {
  ok(res, await paymentsService.initiatePayment(req.body, req.user!.id), 201);
}

/** Paystack calls this with a raw JSON body; the signature is checked in the service. */
export async function paystackWebhook(req: Request, res: Response) {
  const signature = req.headers["x-paystack-signature"];
  if (!Buffer.isBuffer(req.body) || typeof signature !== "string") {
    res.status(400).json({ success: false, error: "Invalid webhook request" });
    return;
  }
  await paymentsService.handlePaystackWebhook(req.body, signature);
  res.sendStatus(200);
}

export async function verifyPayment(req: Request, res: Response) {
  ok(res, await paymentsService.verifyPayment(id(req), req.user!.id, req.user!.role));
}

export async function simulateSuccess(req: Request, res: Response) {
  ok(res, await paymentsService.simulateSuccess(id(req), req.user!.id));
}

export async function releaseEscrow(req: Request, res: Response) {
  ok(res, await paymentsService.releaseEscrow(id(req), "ADMIN"));
}

export async function refundPayment(req: Request, res: Response) {
  ok(res, await paymentsService.refundPayment(id(req), { amount: req.body.amount, reason: req.body.reason, actorId: req.user!.id }));
}

export async function createDispute(req: Request, res: Response) {
  ok(res, await paymentsService.createDispute(id(req), req.user!.id, req.body.reason), 201);
}

export async function getMyPayments(req: Request, res: Response) {
  ok(res, await paymentsService.getMyPayments(req.user!.id, req.user!.role));
}

export async function getPayment(req: Request, res: Response) {
  ok(res, await paymentsService.getPayment(id(req), req.user!.id, req.user!.role));
}
