// Global Express 5 error handler — the last middleware in app.ts.
// Any error thrown or passed to next(err) in a route ends up here.

import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export interface AppError extends Error {
  statusCode?: number;
  /** Machine-readable reason clients can branch on, e.g. EMAIL_NOT_VERIFIED. */
  code?: string;
  /** Extra non-sensitive data for the client, e.g. the userId to verify. */
  data?: Record<string, unknown>;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: err.issues[0]?.message ?? "Check the highlighted fields",
      code: "VALIDATION_FAILED",
      details: err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ success: false, error: "That already exists.", code: "DUPLICATE" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ success: false, error: "We couldn't find that.", code: "NOT_FOUND" });
      return;
    }
  }

  if (err.name === "MulterError") {
    const message = (err as AppError & { code?: string }).code === "LIMIT_FILE_SIZE" ? "That file is too large." : err.message;
    res.status(400).json({ success: false, error: message, code: "UPLOAD_REJECTED" });
    return;
  }

  // Body-parser errors (malformed JSON, payload too large) carry a status.
  const parserStatus = (err as { status?: number }).status;
  const statusCode = err.statusCode ?? (parserStatus && parserStatus < 500 ? parserStatus : 500);
  const message =
    statusCode === 500 && env.NODE_ENV === "production" ? "Something went wrong on our side. Please try again." : err.message;

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.code && { code: err.code }),
    ...(err.data && { data: err.data }),
    ...(env.NODE_ENV === "development" && statusCode >= 500 && { stack: err.stack }),
  });
}

/** Create an error with an HTTP status, and optionally a code and client data. */
export function createError(
  message: string,
  statusCode: number,
  extra?: { code?: string; data?: Record<string, unknown> },
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (extra?.code) error.code = extra.code;
  if (extra?.data) error.data = extra.data;
  return error;
}
