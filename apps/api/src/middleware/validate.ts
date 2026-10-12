// File: apps/api/src/middleware/validate.ts
// Zod 4 request validator middleware
// Validates req.body, req.query, and req.params against a Zod schema
// Throws 400 with field-level error details on failure

import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validate request data against Zod schemas
 * Usage: router.post('/', validate({ body: CreateListingSchema }), controller)
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }
      next();
    } catch (error) {
      next(error); // ZodError caught by errorHandler.ts
    }
  };
}
