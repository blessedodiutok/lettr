// File: apps/api/src/middleware/roles.ts
// Role-guard factory — use after authenticate() to restrict routes by role

import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { createError } from "./errorHandler.js";

/**
 * Restrict a route to specific roles
 * Usage: router.post('/listings', authenticate, requireRole('LANDLORD'), controller)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createError(`Access restricted to: ${roles.join(", ")}`, 403),
      );
    }

    next();
  };
}
