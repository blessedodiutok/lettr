// HTTP handlers for /api/tenancy

import type { Request, Response } from "express";
import * as tenancyService from "../services/tenancy.service.js";

const ok = (res: Response, data: unknown) => res.json({ success: true, data });

export async function getMyTenancies(req: Request, res: Response) {
  ok(res, await tenancyService.getMyTenancies(req.user!.id, req.user!.role));
}

export async function getAgreement(req: Request, res: Response) {
  ok(res, await tenancyService.getAgreement(String(req.params.id), req.user!.id, req.user!.role));
}

export async function signAgreement(req: Request, res: Response) {
  ok(res, await tenancyService.signAgreement(String(req.params.id), req.user!.id, req.user!.role));
}

export async function markHandover(req: Request, res: Response) {
  ok(res, await tenancyService.markHandover(String(req.params.id), req.user!.id, req.user!.role));
}

export async function confirmMoveIn(req: Request, res: Response) {
  ok(res, await tenancyService.confirmMoveIn(String(req.params.id), req.user!.id, req.user!.role));
}

export async function cancelTenancy(req: Request, res: Response) {
  ok(res, await tenancyService.cancelTenancy(String(req.params.id), req.user!.id, req.user!.role, req.body.reason));
}
