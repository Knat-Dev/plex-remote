import { ValidationError } from '../../shared/errors.js';

/** Assert a value is one of an allowed literal set (guards path building). */
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new ValidationError(`Invalid ${field}: expected one of ${allowed.join(', ')}`);
}

/** Assert a non-empty string. */
export function requireString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  throw new ValidationError(`Missing ${field}`);
}

/** Parse a finite number within [min, max]. */
export function requireNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new ValidationError(`Invalid ${field}: expected number in [${min}, ${max}]`);
  }
  return n;
}
