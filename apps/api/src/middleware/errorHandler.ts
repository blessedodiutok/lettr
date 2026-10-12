// File: apps/api/src/middleware/errorHandler.ts
// Global Express 5 error handler — the last middleware in app.ts
// Any error thrown or passed to next(err) in a route ends up here

import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors — malformed request body/query
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // Prisma known errors — database constraint violations
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Unique constraint violation (e.g. email already registered)
      const field = (err.meta?.target as string[])?.join(", ") ?? "field";
      res.status(409).json({
        success: false,
        error: `A record with this ${field} already exists`,
      });
      return;
    }
    if (err.code === "P2025") {
      // Record not found
      res.status(404).json({
        success: false,
        error: "Record not found",
      });
      return;
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }
  if (err.name === "TokenExpiredError") {
    res.status(401).json({ success: false, error: "Token expired" });
    return;
  }

  // Multer errors (file upload issues)
  if (err.name === "MulterError") {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  // App-level errors with a specific status code
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500 && env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message;

  if (statusCode === 500) {
    console.error("Unhandled error:", err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/** Helper to create typed app errors with status codes */
export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}
