import { mapFundDailyReport, mapFundSearchItem, mapFundSummary, pickBestCadastro } from "../mappers/cvm.mapper";
import { CvmProvider } from "../providers/cvm.provider";
import type { FundDocumentsResponse, FundSearchResponse, InvestmentFundDailyReport, InvestmentFundSummary } from "../types/financial-contracts";
import { readCache, writeCache } from "../utils/cache";
import { matchesSearch, normalizeCnpj } from "../utils/cnpj";
import { parseCsv, toObjects } from "../utils/csv";

type FundDataServiceDeps = {
  provider: CvmProvider;
  db: D1Database;
};

type CvmDataBundle = {
  cadastro: Array<Record<string, string>>;
  daily: Array<Record<string, string>>;
  fetchedAt: string;
};

const TTL_SEARCH_MS = 24 * 60 * 60 * 1000;
const TTL_SUMMARY_MS = 12 * 60 * 60 * 1000;
const TTL_DAILY_MS = 12 * 60 * 60 * 1000;
const TTL_DOCUMENTS_MS = 24 * 60 * 60 * 1000;

export class FundDataService {
  private readonly provider: CvmProvider;
  private readonly db: D1Database;

  constructor(deps: FundDataServiceDeps) {
    this.provider = deps.provider;
    this.db = deps.db;
  }

  private async loadBundle(): Promise<CvmDataBundle> {
    const cacheKey = "bundle:v1";
    const cached = await readCache<CvmDataBundle>(this.db, "cvm", cacheKey);
    if (cached) return cached;

    const [cadastroCsv, dailyCsv] = await Promise.all([this.provider.fetchCadastroFundsCsv(), this.provider.fetchInformeDiarioLatestCsv()]);
    const bundle: CvmDataBundle = {
      cadastro: toObjects(parseCsv(cadastroCsv)),
      daily: toObjects(parseCsv(dailyCsv)),
      fetchedAt: new Date().toISOString(),
    };
    await writeCache(this.db, "cvm", cacheKey, bundle, TTL_DAILY_MS);
    return bundle;
  }

  async searchFunds(query: string): Promise<FundSearchResponse> {
    const normalized = query.trim();
    const cacheKey = `search:${normalized.toLowerCase()}`;
    const cached = await readCache<FundSearchResponse>(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const items = bundle.cadastro
      .filter((item) => normalized.length > 0 && matchesSearch(item.DENOM_SOCIAL ?? "", normalized))
      .slice(0, 50)
      .map(mapFundSearchItem);
    const response: FundSearchResponse = {
      query: normalized,
      items,
      fetchedAt: new Date().toISOString(),
    };
    await writeCache(this.db, "cvm", cacheKey, response, TTL_SEARCH_MS);
    return response;
  }

  async getFundSummary(cnpj: string): Promise<InvestmentFundSummary | null> {
    const normalized = normalizeCnpj(cnpj);
    const cacheKey = `summary:${normalized}`;
    const cached = await readCache<InvestmentFundSummary>(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const cadastroCandidates = bundle.cadastro.filter((item) => normalizeCnpj(item.CNPJ_FUNDO ?? "") === normalized);
    const cadastro = pickBestCadastro(cadastroCandidates, normalized);
    if (!cadastro) return null;
    const daily = this.pickLatestDaily(bundle.daily, normalized);
    const summary = mapFundSummary(cadastro, daily, new Date().toISOString());
    await writeCache(this.db, "cvm", cacheKey, summary, TTL_SUMMARY_MS);
    return summary;
  }

  async getFundDailyLatest(cnpj: string): Promise<InvestmentFundDailyReport | null> {
    const normalized = normalizeCnpj(cnpj);
    const cacheKey = `daily-latest:${normalized}`;
    const cached = await readCache<InvestmentFundDailyReport>(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const latest = this.pickLatestDaily(bundle.daily, normalized);
    if (!latest) return null;
    const report = mapFundDailyReport(normalized, latest, new Date().toISOString());
    await writeCache(this.db, "cvm", cacheKey, report, TTL_DAILY_MS);
    return report;
  }

  async getFundDailyHistory(cnpj: string, limit: number): Promise<InvestmentFundDailyReport[]> {
    const normalized = normalizeCnpj(cnpj);
    const bundle = await this.loadBundle();
    return bundle.daily
      .filter((item) => normalizeCnpj(item.CNPJ_FUNDO_CLASSE ?? item.CNPJ_FUNDO ?? "") === normalized)
      .sort((a, b) => String(b.DT_COMPTC ?? "").localeCompare(String(a.DT_COMPTC ?? "")))
      .slice(0, limit)
      .map((item) => mapFundDailyReport(normalized, item, new Date().toISOString()));
  }

  async getFundDocuments(cnpj: string): Promise<FundDocumentsResponse> {
    const normalized = normalizeCnpj(cnpj);
    const cacheKey = `documents:${normalized}`;
    const cached = await readCache<FundDocumentsResponse>(this.db, "cvm", cacheKey);
    if (cached) return cached;

    const bundle = await this.loadBundle();
    const cadastro = pickBestCadastro(bundle.cadastro.filter((item) => normalizeCnpj(item.CNPJ_FUNDO ?? "") === normalized), normalized);
    const fundName = cadastro?.DENOM_SOCIAL ?? null;
    const fetchedAt = new Date().toISOString();

    const baseCvmUrl = "https://cvmweb.cvm.gov.br/swb/default.asp?sg_sistema=scw&sg_tipo_consulta=fundos";
    const candidateItems: FundDocumentsResponse["items"] = [
      {
        cnpj: normalized,
        fundName,
        type: "report",
        title: "Consulta pública do fundo na CVM",
        documentDate: null,
        referenceDate: null,
        source: "cvm",
        url: baseCvmUrl,
        fetchedAt,
      },
      {
        cnpj: normalized,
        fundName,
        type: "fact_sheet",
        title: "Lâmina do fundo (se disponível na CVM)",
        documentDate: null,
        referenceDate: null,
        source: "cvm",
        url: "https://dados.cvm.gov.br/dados/FI/DOC/LAMINA/DADOS/",
        fetchedAt,
      },
      {
        cnpj: normalized,
        fundName,
        type: "financial_statement",
        title: "Demonstrações financeiras de fundos (CVM)",
        documentDate: null,
        referenceDate: null,
        source: "cvm",
        url: "https://dados.cvm.gov.br/dados/FI/DOC/DFP/DADOS/",
        fetchedAt,
      },
    ];

    const checks = await Promise.all(candidateItems.map((item) => (item.url ? this.provider.checkUrl(item.url) : Promise.resolve(false))));
    const items = candidateItems.filter((_item, idx) => checks[idx]);
    const result: FundDocumentsResponse = { cnpj: normalized, items, fetchedAt };
    await writeCache(this.db, "cvm", cacheKey, result, TTL_DOCUMENTS_MS);
    return result;
  }

  private pickLatestDaily(items: Array<Record<string, string>>, cnpj: string): Record<string, string> | null {
    const normalized = normalizeCnpj(cnpj);
    const filtered = items.filter((item) => normalizeCnpj(item.CNPJ_FUNDO_CLASSE ?? item.CNPJ_FUNDO ?? "") === normalized);
    if (filtered.length === 0) return null;
    return filtered.sort((a, b) => String(b.DT_COMPTC ?? "").localeCompare(String(a.DT_COMPTC ?? "")))[0];
  }
}
