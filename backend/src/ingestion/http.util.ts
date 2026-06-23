export class HttpFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'HttpFetchError';
  }
}

export async function fetchJson<T>(
  url: string,
  timeoutMs = 10_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'SignalScout/0.1 (+https://signalscout.app)',
      },
    });
    if (!response.ok) {
      throw new HttpFetchError(
        `GET ${url} → ${response.status}`,
        response.status,
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof HttpFetchError) {
      throw error;
    }
    throw new HttpFetchError(`GET ${url} failed: ${(error as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text: string, max = 4000): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
