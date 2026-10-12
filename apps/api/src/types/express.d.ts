// File: apps/api/src/types/express.d.ts
// Extends Express Request so req.user is available after auth middleware runs

import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export {};
