import type { FundSearchItem, InvestmentFundDailyReport, InvestmentFundSummary } from "../types/financial-contracts";
import { normalizeCnpj } from "../utils/cnpj";

type CvmCadastro = Record<string, string>;
type CvmDaily = Record<string, string>;

const toNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBool = (value: string | undefined): boolean | null => {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === "S" || v === "SIM" || v === "Y" || v === "1") return true;
  if (v === "N" || v === "NAO" || v === "NÃO" || v === "0") return false;
  return null;
};

export const pickBestCadastro = (items: CvmCadastro[], cnpj: string): CvmCadastro | null => {
  const normalized = normalizeCnpj(cnpj);
  const exact = items.find((item) => normalizeCnpj(item.CNPJ_FUNDO ?? "") === normalized);
  if (exact) return exact;
  return items[0] ?? null;
};

export const mapFundSearchItem = (cadastro: CvmCadastro): FundSearchItem => ({
  cnpj: normalizeCnpj(cadastro.CNPJ_FUNDO ?? ""),
  name: cadastro.DENOM_SOCIAL ?? "",
  status: cadastro.SIT ?? null,
  className: cadastro.CLASSE_ANBIMA ?? cadastro.DIRETOR ?? null,
});

export const mapFundDailyReport = (cnpj: string, daily: CvmDaily, fetchedAt: string): InvestmentFundDailyReport => ({
  source: "cvm",
  cnpj: normalizeCnpj(cnpj),
  date: (daily.DT_COMPTC ?? "").slice(0, 10),
  quotaValue: toNumber(daily.VL_QUOTA),
  netWorth: toNumber(daily.VL_PATRIM_LIQ),
  portfolioValue: toNumber(daily.VL_TOTAL),
  fundraising: toNumber(daily.CAPTC_DIA),
  redemption: toNumber(daily.RESG_DIA),
  shareholders: toNumber(daily.NR_COTST),
  fetchedAt,
});

export const mapFundSummary = (cadastro: CvmCadastro, daily: CvmDaily | null, fetchedAt: string): InvestmentFundSummary => ({
  source: "cvm",
  cnpj: normalizeCnpj(cadastro.CNPJ_FUNDO ?? ""),
  name: cadastro.DENOM_SOCIAL ?? "",
  status: cadastro.SIT ?? null,
  className: cadastro.CLASSE_ANBIMA ?? null,
  administrator: cadastro.ADMIN ?? cadastro.DENOM_SOCIAL_ADMIN ?? null,
  manager: cadastro.GESTOR ?? cadastro.DIRETOR ?? null,
  startDate: (cadastro.DT_INI_ATIV ?? "").slice(0, 10) || null,
  benchmark: cadastro.INDICADOR_DESEMPENHO ?? null,
  exclusive: toBool(cadastro.FUNDO_EXCLUSIVO),
  qualifiedInvestor: toBool(cadastro.CONDOM),
  professionalInvestor: toBool(cadastro.FUNDO_COTAS),
  openFund: toBool(cadastro.FUNDO_COTAS),
  latestQuotaDate: daily ? (daily.DT_COMPTC ?? "").slice(0, 10) : null,
  latestQuotaValue: daily ? toNumber(daily.VL_QUOTA) : null,
  latestNetWorth: daily ? toNumber(daily.VL_PATRIM_LIQ) : null,
  latestFundraising: daily ? toNumber(daily.CAPTC_DIA) : null,
  latestRedemption: daily ? toNumber(daily.RESG_DIA) : null,
  latestShareholders: daily ? toNumber(daily.NR_COTST) : null,
  fetchedAt,
});
