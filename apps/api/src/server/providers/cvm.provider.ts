type CvmProviderDeps = {
  baseUrl: string;
};

const tryFetchText = async (url: string, timeoutMs: number): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/csv,application/octet-stream,text/plain,*/*",
        "User-Agent": "EsquiloInvest-MVP/1.0 (+https://esquiloinvest.local)",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`cvm_status_${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const yearMonth = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
};

export class CvmProvider {
  private readonly baseUrl: string;

  constructor(deps: CvmProviderDeps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
  }

  async fetchCadastroFundsCsv(): Promise<string> {
    const url = `${this.baseUrl}/dados/FI/CAD/DADOS/cad_fi.csv`;
    return tryFetchText(url, 15000);
  }

  async fetchInformeDiarioLatestCsv(): Promise<string> {
    const now = new Date();
    const attempts = [0, 1, 2, 3].map((offset) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      return `${this.baseUrl}/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${yearMonth(d)}.csv`;
    });
    let lastError: unknown;
    for (const url of attempts) {
      try {
        return await tryFetchText(url, 15000);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("cvm_upstream_error");
  }

  async checkUrl(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 10000);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "EsquiloInvest-MVP/1.0 (+https://esquiloinvest.local)",
        },
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}
