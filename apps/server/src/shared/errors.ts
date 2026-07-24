/** Domain-level "not found", mapped to HTTP 404 at the boundary. */
export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

/** Invalid caller input, mapped to HTTP 400 at the boundary. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
