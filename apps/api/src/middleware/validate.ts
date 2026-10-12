// Zod request validator. Replaces req.body/query/params with the parsed values.
// Express 5 exposes req.query as a read-only getter, so parsed values are
// defined as own properties that shadow it instead of being assigned.

import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function replace(req: Request, key: "query" | "params", value: unknown) {
  Object.defineProperty(req, key, { value, writable: true, configurable: true, enumerable: true });
}

/** Usage: router.post('/', validate({ body: CreateListingSchema }), controller) */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      if (schemas.query) replace(req, "query", schemas.query.parse(req.query));
      if (schemas.params) replace(req, "params", schemas.params.parse(req.params));
      next();
    } catch (error) {
      next(error); // ZodError is formatted by errorHandler.ts
    }
  };
}
