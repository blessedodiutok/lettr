// HTTP handlers for /api/users

import type { Request, Response } from "express";
import * as usersService from "../services/users.service.js";

const ok = (res: Response, data: unknown) => res.json({ success: true, data });

export async function getProfile(req: Request, res: Response) {
  ok(res, await usersService.getProfile(req.user!.id));
}

export async function updateProfile(req: Request, res: Response) {
  ok(res, await usersService.updateProfile(req.user!.id, req.body));
}

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ success: false, error: "Choose a photo to upload." });
    return;
  }
  ok(res, await usersService.uploadAvatar(req.user!.id, req.file));
}

export async function getBanks(_req: Request, res: Response) {
  ok(res, await usersService.getBanks());
}

export async function setBankAccount(req: Request, res: Response) {
  ok(res, await usersService.setBankAccount(req.user!.id, req.body));
}

export async function getScreeningProfile(req: Request, res: Response) {
  ok(res, await usersService.getScreeningProfile(String(req.params.id), req.user!.id, req.user!.role));
}

export async function getPublicLandlord(req: Request, res: Response) {
  ok(res, await usersService.getPublicLandlord(String(req.params.id)));
}
