// JWT authentication guard. Reads the Bearer access token, then confirms the
// account still exists and is active, so suspensions and role changes apply
// immediately rather than when the 15-minute token expires.

import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { createError } from "./errorHandler.js";

interface AccountState {
  isActive: boolean;
  role: UserRole;
  expiresAt: number;
}

// Short-lived cache so the account check costs one query per user per 30s.
const ACCOUNT_CACHE_MS = 30_000;
const accountCache = new Map<string, AccountState>();

export function invalidateAccountCache(userId: string): void {
  accountCache.delete(userId);
}

async function getAccountState(userId: string): Promise<AccountState | null> {
  const cached = accountCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true, role: true } });
  if (!user) {
    accountCache.delete(userId);
    return null;
  }
  const state = { ...user, expiresAt: Date.now() + ACCOUNT_CACHE_MS };
  if (accountCache.size > 10_000) accountCache.clear();
  accountCache.set(userId, state);
  return state;
}

function readBearer(req: Request): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

async function resolveUser(token: string): Promise<Request["user"] | "suspended" | null> {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return null;
  }
  const account = await getAccountState(payload.sub);
  if (!account) return null;
  if (!account.isActive) return "suspended";
  return {
    id: payload.sub,
    email: payload.email,
    role: account.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readBearer(req);
  if (!token) return next(createError("Please log in to continue", 401));
  try {
    const user = await resolveUser(token);
    if (user === "suspended") return next(createError("Your account has been suspended. Contact support.", 403));
    if (!user) return next(createError("Your session has expired. Please log in again.", 401));
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Attaches the user when a valid token is present; never rejects the request. */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readBearer(req);
  if (token) {
    try {
      const user = await resolveUser(token);
      if (user && user !== "suspended") req.user = user;
    } catch {
      // Treat lookup failures as anonymous access.
    }
  }
  next();
}
