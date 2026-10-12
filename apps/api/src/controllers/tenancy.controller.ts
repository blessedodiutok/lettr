// File: apps/api/src/controllers/tenancy.controller.ts
// HTTP handlers for the tenancy domain

import type { NextFunction, Request, Response } from "express";
import * as tenancyService from "../services/tenancy.service.js";

export async function createAgreement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const agreement = await tenancyService.createAgreement(
      req.body,
      req.user!.id,
    );
    res.status(201).json({ success: true, data: agreement });
  } catch (error) {
    next(error);
  }
}

export async function getMyTenancies(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenancies = await tenancyService.getMyTenancies(
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, data: tenancies });
  } catch (error) {
    next(error);
  }
}

export async function getAgreement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const agreement = await tenancyService.getAgreement(
      String(req.params.id),
      req.user!.id,
    );
    res.json({ success: true, data: agreement });
  } catch (error) {
    next(error);
  }
}

export async function signAgreement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const agreement = await tenancyService.signAgreement(
      String(req.params.id),
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, data: agreement });
  } catch (error) {
    next(error);
  }
}

export async function confirmHandover(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const agreement = await tenancyService.confirmHandover(
      String(req.params.id),
      req.user!.id,
    );
    res.json({ success: true, data: agreement });
  } catch (error) {
    next(error);
  }
}
