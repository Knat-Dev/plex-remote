/**
 * Tiny typed fetch wrapper around the same-origin API. Centralises error
 * handling and gives every request a timeout, so a request that rides a stale
 * connection (common right after an iOS PWA resumes from the background) fails
 * fast instead of hanging for the browser's multi-second socket timeout and
 * then completing in a late burst.
 */
export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  /** Abort (and reject) after this many ms. Commands use a short budget. */
  timeoutMs?: number;
}

/** GETs may be large (library pages); commands must feel instant. */
const DEFAULT_TIMEOUT_MS = 15_000;
const COMMAND_TIMEOUT_MS = 6_000;

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`/api${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
    if (!res.ok) {
      throw new ApiError(res.status, await readError(res));
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readError(res: Response): Promise<string> {
  try {
    return ((await res.json()) as { error?: string }).error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(
      path,
      { method: 'POST', body: body ? JSON.stringify(body) : undefined },
      options,
    ),
  /** A player command: fire immediately, fail fast, never hang. */
  command: <T>(path: string, body?: unknown) =>
    request<T>(
      path,
      { method: 'POST', body: body ? JSON.stringify(body) : undefined },
      { timeoutMs: COMMAND_TIMEOUT_MS },
    ),
};
