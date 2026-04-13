export class UpstreamHttpError extends Error {
  readonly status: number;
  readonly source: "brapi" | "cvm" | "fipe";

  constructor(message: string, status: number, source: "brapi" | "cvm" | "fipe") {
    super(message);
    this.name = "UpstreamHttpError";
    this.status = status;
    this.source = source;
  }
}

type HttpRequestOptions = {
  timeoutMs: number;
  source: "brapi" | "cvm" | "fipe";
  retryOnStatuses?: number[];
};

const DEFAULT_RETRY_STATUSES = [502, 503, 504];

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function httpJson<T>(url: string, init: RequestInit, options: HttpRequestOptions): Promise<T> {
  const retryStatuses = options.retryOnStatuses ?? DEFAULT_RETRY_STATUSES;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init, options.timeoutMs);
      if (!response.ok) {
        if (retryStatuses.includes(response.status) && attempt === 0) {
          await sleep(250);
          continue;
        }
        throw new UpstreamHttpError(`Upstream ${options.source} returned status ${response.status}`, response.status, options.source);
      }
      return (await response.json()) as T;
    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === "AbortError" || String(error.message).toLowerCase().includes("timeout"));
      const shouldRetry = attempt === 0 && isTimeout;
      if (shouldRetry) {
        await sleep(250);
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }
  }

  if (lastError instanceof UpstreamHttpError) throw lastError;
  if (lastError instanceof Error && (lastError.name === "AbortError" || String(lastError.message).toLowerCase().includes("timeout"))) {
    throw new UpstreamHttpError(`Timeout calling ${options.source}`, 408, options.source);
  }
  throw new UpstreamHttpError(`Failed to call ${options.source}`, 500, options.source);
}
