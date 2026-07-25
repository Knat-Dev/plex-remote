/** Domain-level "not found", mapped to HTTP 404 at the boundary. */
export class NotFoundError extends Error {
  /** Fastify reads this natively; our error handler also honours it. */
  readonly statusCode = 404;
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

/** Invalid caller input, mapped to HTTP 400 at the boundary. */
export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
