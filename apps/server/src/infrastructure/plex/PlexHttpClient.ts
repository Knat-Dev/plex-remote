import { PlexHttpError, redact } from './PlexHttpError.js';

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT';
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, string | number | boolean | undefined>;
  readonly retries?: number;
  readonly timeoutMs: number;
}

/**
 * Thin, resilient wrapper over fetch: per-request timeout, bounded retry with
 * backoff for transient failures (network errors, 502/503/504), and JSON decoding.
 * It knows nothing about Plex semantics — that lives in the gateways.
 */
export class PlexHttpClient {
  async json<T>(url: string, options: RequestOptions): Promise<T> {
    const res = await this.send(url, options);
    return (await res.json()) as T;
  }

  async raw(url: string, options: RequestOptions): Promise<Response> {
    return this.send(url, options);
  }

  async send(url: string, options: RequestOptions): Promise<Response> {
    const target = withQuery(url, options.query);
    const attempts = Math.max(1, (options.retries ?? 2) + 1);
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await this.#once(target, options);
        if (res.ok) return res;
        if (!isRetryable(res.status) || attempt === attempts) {
          throw new PlexHttpError(res.status, target, await safeText(res));
        }
      } catch (error) {
        lastError = error;
        if (error instanceof PlexHttpError && !isRetryable(error.status)) throw error;
        if (attempt === attempts) break;
      }
      await delay(backoffMs(attempt));
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(`Plex request failed for ${redact(target)}`);
  }

  async #once(url: string, options: RequestOptions): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const init: RequestInit = {
        method: options.method ?? 'GET',
        signal: controller.signal,
      };
      if (options.headers) init.headers = options.headers;
      return await fetch(url, init);
    } finally {
      clearTimeout(timer);
    }
  }
}

function withQuery(url: string, query: RequestOptions['query']): string {
  if (!query) return url;
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) parsed.searchParams.set(key, String(value));
  }
  return parsed.toString();
}

function isRetryable(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function backoffMs(attempt: number): number {
  return Math.min(1000, 150 * 2 ** (attempt - 1));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
}
