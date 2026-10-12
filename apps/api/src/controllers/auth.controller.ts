// HTTP handlers for /api/auth.
// Web clients keep the refresh token in an httpOnly cookie. Mobile clients
// identify themselves with `X-Client-Platform: mobile` and receive the refresh
// token in the response body, storing it in the device keychain.

import type { CookieOptions, Request, Response } from "express";
import { env, isProduction } from "../config/env.js";
import { refreshTtlSeconds } from "../lib/jwt.js";
import * as authService from "../services/auth.service.js";

const REFRESH_COOKIE = "refreshToken";
// Non-secret hint read by the web app's route guard to redirect early. The API enforces access.
const ROLE_COOKIE = "lettr_role";

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/auth",
  };
}

const isMobile = (req: Request) => req.get("x-client-platform") === "mobile";

function deviceLabel(req: Request): string {
  return `${isMobile(req) ? "mobile" : "web"} · ${(req.get("user-agent") ?? "unknown").slice(0, 120)}`;
}

function readRefreshToken(req: Request): string | undefined {
  return isMobile(req) ? req.body?.refreshToken : req.cookies?.[REFRESH_COOKIE];
}

function clearSessionCookies(res: Response) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  res.clearCookie(ROLE_COOKIE, { ...cookieOptions(), path: "/" });
}

/** Deliver tokens in the way each client expects. */
function sendSession(
  req: Request,
  res: Response,
  role: string,
  payload: { accessToken: string; refreshToken: string; user?: unknown },
) {
  const { refreshToken, ...rest } = payload;
  if (isMobile(req)) {
    res.json({ success: true, data: { ...rest, refreshToken } });
    return;
  }
  const maxAge = refreshTtlSeconds() * 1000;
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions(), maxAge });
  res.cookie(ROLE_COOKIE, role.toLowerCase(), { ...cookieOptions(), path: "/", maxAge });
  res.json({ success: true, data: rest });
}

export async function signup(req: Request, res: Response) {
  res.status(201).json({ success: true, data: await authService.signup(req.body) });
}

export async function login(req: Request, res: Response) {
  const session = await authService.login(req.body, deviceLabel(req));
  sendSession(req, res, session.user.role, session);
}

export async function verifyOtp(req: Request, res: Response) {
  const session = await authService.verifyOtp(req.body, deviceLabel(req));
  sendSession(req, res, session.user.role, session);
}

export async function resendOtp(req: Request, res: Response) {
  res.json({ success: true, data: await authService.resendOtp(req.body.userId) });
}

export async function refresh(req: Request, res: Response) {
  const token = readRefreshToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: "Please log in to continue", code: "SESSION_EXPIRED" });
    return;
  }
  try {
    const session = await authService.refreshTokens(token);
    sendSession(req, res, session.role, session);
  } catch (error) {
    clearSessionCookies(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout(readRefreshToken(req));
  clearSessionCookies(res);
  res.json({ success: true, data: { message: "Logged out" } });
}

export async function getMe(req: Request, res: Response) {
  res.json({ success: true, data: await authService.getMe(req.user!.id) });
}

export async function forgotPassword(req: Request, res: Response) {
  res.json({ success: true, data: await authService.forgotPassword(req.body.email) });
}

export async function resetPassword(req: Request, res: Response) {
  clearSessionCookies(res);
  res.json({ success: true, data: await authService.resetPassword(req.body.token, req.body.password) });
}

export async function changePassword(req: Request, res: Response) {
  const tokens = await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword, deviceLabel(req));
  sendSession(req, res, req.user!.role, tokens);
}
