import type { NextFunction, Request, Response } from "express";
import * as paymentsService from "../services/payments.service.js";

export async function initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.initiatePayment(req.body, req.user!.id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function paystackWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({ success: false, error: "Raw webhook body required" });
      return;
    }

    const signature = req.headers["x-paystack-signature"];
    if (typeof signature !== "string") {
      res.status(401).json({ success: false, error: "Missing Paystack signature" });
      return;
    }

    await paymentsService.handlePaystackWebhook(req.body, signature);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export async function releaseEscrow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.releaseEscrow(String(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMyPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.getMyPayments(req.user!.id, req.user!.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.getPayment(String(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.verifyPayment(String(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.refundPayment(String(req.params.id), req.body.amount, req.body.reason, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.createDispute(String(req.params.id), req.user!.id, req.body.reason);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
