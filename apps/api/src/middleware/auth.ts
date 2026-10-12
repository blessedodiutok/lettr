// File: apps/api/src/middleware/auth.ts
// JWT authentication guard — reads token from httpOnly cookie (web)
// or Authorization: Bearer header (mobile), verifies it, attaches user to req

import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { createError } from "./errorHandler.js";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // 1. Try httpOnly cookie first (web — more secure)
  let token: string | undefined = req.cookies?.accessToken;

  // 2. Fall back to Authorization: Bearer <token> (mobile app)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return next(createError("Authentication required", 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    next();
  } catch {
    next(createError("Invalid or expired token", 401));
  }
}

/** Optional auth — attaches user if token is present, continues regardless */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  let token: string | undefined = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };
    } catch {
      // Token invalid — continue without user attached
    }
  }

  next();
}
