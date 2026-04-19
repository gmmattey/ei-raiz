/**
 * BenchmarkService
 *
 * Responsável por calcular retornos de benchmark (CDI) a partir de dados
 * públicos do Banco Central (série SGS 4389 — CDI diário).
 *
 * Centraliza o cálculo que antes estava inline em `carteira.routes.ts` para
 * permitir reúso pelo FinancialCoreService e evitar duplicação.
 */
export class BenchmarkService {
  /**
   * Retorno acumulado do CDI entre `dataInicioIso` e hoje, em percentual.
   * Usa a série diária SGS 4389 do BCB. Retorna 0 quando indisponível.
   */
  async cdiReturnSince(dataInicioIso: string): Promise<number> {
    const inicio = new Date(dataInicioIso);
    if (Number.isNaN(inicio.getTime())) return 0;
    const fim = new Date();
    const fmt = (d: Date): string =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const response = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json&dataInicial=${encodeURIComponent(fmt(inicio))}&dataFinal=${encodeURIComponent(fmt(fim))}`,
    );
    if (!response.ok) return 0;
    const series = (await response.json()) as Array<{ valor: string }>;
    if (!Array.isArray(series) || series.length === 0) return 0;
    let acumulado = 1;
    for (const ponto of series) {
      const taxa = Number.parseFloat(String(ponto.valor).replace(",", "."));
      if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
    }
    return Number(((acumulado - 1) * 100).toFixed(2));
  }
}
