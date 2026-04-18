import type {
  MapaPrecosHistoricos,
  ProvedorHistoricoCotacoes,
} from "@ei/contratos";

import { BrapiProvider } from "../providers/brapi.provider";
import type { Env } from "../types/gateway";
import type { ListedAssetHistoryPoint } from "../types/financial-contracts";
import { MarketDataService } from "./market-data.service";

/**
 * Range e intervalo padrão para reconstrução: 10 anos com granularidade mensal
 * → ~120 pontos por ticker, suficiente para a maioria dos casos. Quando o
 * ativo é mais antigo que isso, os meses sem cobertura caem no fallback de
 * preço médio na camada do serviço de reconstrução.
 */
const RANGE_PADRAO = "10y";
const INTERVALO_PADRAO = "1mo";

/**
 * Adapter sobre `MarketDataService.getHistory` que entrega o mapa
 * `Map<ticker, Map<ano-mes, close>>` consumido por `ServicoReconstrucaoCarteira`.
 *
 * Usa cache D1 (TTL 30min) já implementado dentro do MarketDataService.
 * Tickers que falharem no provedor externo são silenciosamente omitidos do
 * mapa — a reconstrução cai no fallback de preço médio.
 */
export class ProvedorHistoricoCotacoesBrapi
  implements ProvedorHistoricoCotacoes
{
  constructor(private readonly marketData: MarketDataService) {}

  async obterPrecosHistoricosMensais(
    tickers: string[],
  ): Promise<MapaPrecosHistoricos> {
    const mapa: MapaPrecosHistoricos = new Map();
    if (tickers.length === 0) return mapa;

    const normalizados = Array.from(
      new Set(
        tickers
          .map((t) => (typeof t === "string" ? t.trim().toUpperCase() : ""))
          .filter((t) => t.length > 0),
      ),
    );

    // Em paralelo (BRAPI rate-limit já tratado no provider/cache)
    const resultados = await Promise.all(
      normalizados.map(async (ticker) => {
        try {
          const historico = await this.marketData.getHistory(
            ticker,
            RANGE_PADRAO,
            INTERVALO_PADRAO,
          );
          return { ticker, pontos: historico.points };
        } catch {
          return { ticker, pontos: [] as ListedAssetHistoryPoint[] };
        }
      }),
    );

    for (const { ticker, pontos } of resultados) {
      const porMes = new Map<string, number>();
      for (const ponto of pontos) {
        const anoMes = extrairAnoMes(ponto.date);
        if (!anoMes) continue;
        if (typeof ponto.close === "number" && Number.isFinite(ponto.close) && ponto.close > 0) {
          // Granularidade 1mo na BRAPI já vem 1 ponto por mês — em caso de
          // duplicata (raro), o último prevalece.
          porMes.set(anoMes, ponto.close);
        }
      }
      if (porMes.size > 0) {
        mapa.set(ticker, porMes);
      }
    }

    return mapa;
  }
}

/**
 * Extrai "YYYY-MM" de uma data ISO ("YYYY-MM-DD" ou ISO 8601 completo).
 * Retorna null para entradas inválidas.
 */
function extrairAnoMes(data: string): string | null {
  if (typeof data !== "string" || data.length < 7) return null;
  const candidato = data.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(candidato)) return null;
  return candidato;
}

/**
 * Factory: constrói o provedor canônico (Brapi) a partir do `env`.
 * Retorna `undefined` quando `BRAPI_TOKEN` não está configurado — assim a
 * reconstrução continua funcional usando o fallback de preço médio.
 */
export function construirProvedorHistoricoCotacoes(
  env: Env,
): ProvedorHistoricoCotacoes | undefined {
  const token = env.BRAPI_TOKEN?.trim();
  if (!token) return undefined;
  const marketData = new MarketDataService({
    db: env.DB,
    provider: new BrapiProvider({
      token,
      baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api",
    }),
  });
  return new ProvedorHistoricoCotacoesBrapi(marketData);
}
