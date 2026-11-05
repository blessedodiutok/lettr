import { Prisma } from "@prisma/client";

/**
 * Sends database decimals as JSON numbers, which is what the API's types promise.
 * JSON.stringify calls toJSON before the replacer, so `value` is already a string
 * by the time it gets here. The original is still on `this`.
 */
export function moneyAsNumber(this: unknown, key: string, value: unknown): unknown {
  const original = (this as Record<string, unknown>)[key];
  return original instanceof Prisma.Decimal ? original.toNumber() : value;
}
