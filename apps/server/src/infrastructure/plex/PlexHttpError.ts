/**
 * Raised when a Plex endpoint returns a non-2xx status after retries.
 * Carries the status so the HTTP layer can map it to a meaningful response.
 */
export class PlexHttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`Plex request failed (${status}) for ${redact(url)}`);
    this.name = 'PlexHttpError';
  }
}

/** Strip token query params so URLs are safe to log. */
export function redact(url: string): string {
  return url.replace(/([?&](?:X-Plex-Token|token)=)[^&]+/gi, '$1REDACTED');
}
