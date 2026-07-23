export type ApiClientOptions = {
  baseUrl?: string;
};

function normalizeBaseUrl(value?: string): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

export function createApiClient(opts: ApiClientOptions = {}) {
  const envBaseUrl = normalizeBaseUrl(
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? String(import.meta.env.VITE_API_BASE_URL)
      : "",
  );

  const explicitBaseUrl = normalizeBaseUrl(opts.baseUrl);
  const baseUrl = explicitBaseUrl || envBaseUrl;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = baseUrl ? `${baseUrl}${path}` : path;

    const res = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status} ${res.statusText}: ${body}`);
    }

    return (await res.json()) as T;
  }

  return { request };
}
