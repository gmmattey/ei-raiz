import type { ApiHoldingDetailEnvelope, HoldingDetailData, HoldingDetailDataReady } from '../../core/data/contracts';
import type { HoldingDetailDataSource } from '../../core/data/data_sources';
import { createRouter, type Router } from '../../core/router';
import type { OperationFeedback } from '../../core/ops/load_state';
import { loading } from '../../core/ops/load_state';
import { toErrorFeedback } from '../../core/ops/error_catalog';
import { bannerFromMissingExternalLink, bannerFromQuotationStatus, bannerFromSourceWarning, type ExternalDataBanner } from '../../core/view_models/external_data';

export type HoldingAttentionSignal = {
  code: 'missing_quote' | 'high_concentration' | 'negative_performance' | 'no_risk_guardrails' | 'external_source_warning';
  title: string;
  body: string;
};

export type HoldingPositiveSignal = {
  code: 'good_performance' | 'healthy_allocation' | 'has_guardrails' | 'priced_ok';
  title: string;
  body: string;
};

export type HoldingSummaryViewModel = {
  headline: string;
  subline: string;
  roleMessage: string;
  metrics: Array<{ key: 'currentValue' | 'allocationPct' | 'performancePct' | 'quantity'; label: string; value: number | null }>;
};

export type HoldingDetailViewModel =
  | { kind: 'redirect_onboarding'; redirectTo: string }
  | {
      kind: 'ready';
      summary: HoldingSummaryViewModel;
      attentionSignals: HoldingAttentionSignal[];
      positiveSignals: HoldingPositiveSignal[];
      holding: HoldingDetailDataReady['holding'];
      ranking: HoldingDetailDataReady['ranking'];
      recommendation: HoldingDetailDataReady['recommendation'];
      categoryContext: HoldingDetailDataReady['categoryContext'];
      externalLink: string | null;
      targets: {
        backToPortfolio: { pathname: string };
      };
    }
  | { kind: 'error'; code?: string; message?: string };

export interface HoldingDetailControllerResult {
  envelope: ApiHoldingDetailEnvelope;
  viewModel: HoldingDetailViewModel;
  loadingFeedback: OperationFeedback;
  errorFeedback?: OperationFeedback;
  externalDataBanner?: ExternalDataBanner | null;
}

export interface HoldingDetailController {
  load(input: { portfolioId: string; holdingId: string }): Promise<HoldingDetailControllerResult>;
}

/**
 * Controller headless do detalhe:
 * - centraliza leitura do contrato do backend novo
 * - suporta redirect_onboarding
 * - expõe target de navegacao de volta para Carteira
 */
export function createHoldingDetailController(input: { holdingDetail: HoldingDetailDataSource; router?: Router }): HoldingDetailController {
  const ds = input.holdingDetail;
  const router = input.router ?? createRouter();
  const loadingFeedback = loading('Carregando detalhe', 'Buscando leitura e recomendacao do ativo.');

  return {
    async load(params) {
      const envelope = await ds.getHoldingDetail(params);
      if (!envelope.ok) {
        return {
          envelope,
          viewModel: { kind: 'error', code: envelope.error.code, message: envelope.error.message },
          loadingFeedback,
          errorFeedback: toErrorFeedback(envelope.error, { area: 'holding_detail' })
        };
      }

      const data = envelope.data as HoldingDetailData;
      if ('screenState' in data && data.screenState === 'redirect_onboarding') {
        return { envelope, viewModel: { kind: 'redirect_onboarding', redirectTo: data.redirectTo || '/onboarding' }, loadingFeedback };
      }

      const ready = data as HoldingDetailDataReady;
      const externalDataBanner = inferExternalBanner(envelope, ready);
      const summary = buildSummary(ready);
      const signals = buildSignals(envelope, ready);
      return {
        envelope,
        loadingFeedback,
        externalDataBanner,
        viewModel: {
          kind: 'ready',
          summary,
          attentionSignals: signals.attention,
          positiveSignals: signals.positive,
          holding: ready.holding,
          ranking: ready.ranking,
          recommendation: ready.recommendation,
          categoryContext: ready.categoryContext,
          externalLink: ready.externalLink ?? null,
          targets: {
            backToPortfolio: { pathname: router.build({ id: 'portfolio' }) }
          }
        }
      };
    }
  };
}

function inferExternalBanner(envelope: ApiHoldingDetailEnvelope, ready: HoldingDetailDataReady): ExternalDataBanner | null {
  return (
    bannerFromSourceWarning(envelope.meta.sourceWarning) ??
    bannerFromQuotationStatus({ quotationStatus: ready.holding.quotationStatus }) ??
    bannerFromMissingExternalLink(ready.externalLink)
  );
}

function buildSummary(ready: HoldingDetailDataReady): HoldingSummaryViewModel {
  const holding = ready.holding;
  const headline = `${holding.code || holding.name}`;
  const subline = `${holding.categoryLabel || holding.assetTypeCode || 'Investimento'} • ${holding.platformName || 'Plataforma nao informada'}`;
  const roleMessage = inferRoleMessage(holding);

  return {
    headline,
    subline,
    roleMessage,
    metrics: [
      { key: 'currentValue', label: 'Valor atual', value: holding.currentValue ?? null },
      { key: 'allocationPct', label: 'Peso na carteira (%)', value: holding.allocationPct ?? null },
      { key: 'performancePct', label: 'Performance (%)', value: holding.performancePct ?? null },
      { key: 'quantity', label: 'Quantidade', value: holding.quantity ?? null }
    ]
  };
}

function inferRoleMessage(holding: HoldingDetailDataReady['holding']): string {
  const allocation = holding.allocationPct ?? 0;
  const performance = holding.performancePct;
  const hasQuote = holding.quotationStatus === 'priced';
  const assetType = (holding.assetTypeCode || '').toUpperCase();

  if (!hasQuote) {
    return 'Sem cotacao atual, a leitura de relevancia e performance fica incompleta. Priorize corrigir a origem do dado antes de decidir.';
  }

  if (assetType === 'PENSION') {
    if (allocation >= 20 && performance != null && performance < -10) {
      return 'Previdencia com peso alto e performance negativa: vale revisar taxas, estrategia e se o produto ainda serve ao seu objetivo.';
    }
    if (allocation >= 20) {
      return 'Previdencia com peso alto: confira se o tamanho esta coerente com seu objetivo e horizonte. Se nao for intencional, pode estar travando flexibilidade.';
    }
    if (allocation >= 8) {
      return performance != null && performance < -10
        ? 'Previdencia relevante e em queda: revise se a alocacao e o produto estao coerentes com sua estrategia.'
        : 'Previdencia relevante: em geral serve como estrategia de longo prazo, mas precisa estar no tamanho certo para nao distorcer a carteira.';
    }
    return performance != null && performance < -10
      ? 'Previdencia pequena mas em queda: monitore e valide se o produto ainda faz sentido.'
      : 'Previdencia pequena: tende a ser parte estrategica de longo prazo; acompanhe para manter coerencia com o restante da carteira.';
  }

  if (allocation >= 20) {
    if (performance != null && performance < -10) return 'Peso alto e performance negativa: este ativo pode estar distorcendo o resultado da carteira.';
    if (performance != null && performance > 15) return 'Peso alto com ganho acumulado: faz sentido avaliar protecao de ganho e diversificacao.';
    return 'Peso alto na carteira: vale revisar se a exposicao esta intencional e coerente com seu perfil.';
  }
  if (allocation >= 8) {
    if (performance != null && performance < -10) return 'Peso relevante e performance negativa: monitore de perto e compare com sua estrategia.';
    return 'Posicao relevante: este ativo tem impacto real no resultado e merece acompanhamento regular.';
  }
  return performance != null && performance < -10 ? 'Posicao pequena, mas em queda: revise se faz sentido manter.' : 'Posicao menor: tende a ter impacto limitado no curto prazo, mas ainda contribui para diversificacao.';
}

function buildSignals(
  envelope: ApiHoldingDetailEnvelope,
  ready: HoldingDetailDataReady
): { attention: HoldingAttentionSignal[]; positive: HoldingPositiveSignal[] } {
  const holding = ready.holding;
  const attention: HoldingAttentionSignal[] = [];
  const positive: HoldingPositiveSignal[] = [];

  if (envelope.meta.sourceWarning) {
    attention.push({
      code: 'external_source_warning',
      title: 'Dado externo complementar',
      body: envelope.meta.sourceWarning
    });
  }

  if (holding.quotationStatus !== 'priced') {
    attention.push({
      code: 'missing_quote',
      title: 'Cotacao indisponivel',
      body: 'Sem cotacao atual, o valor e a performance podem estar incompletos. A leitura principal continua valida, mas a decisao fica prejudicada.'
    });
  } else {
    positive.push({
      code: 'priced_ok',
      title: 'Cotacao disponivel',
      body: 'A leitura de valor e performance tem base de cotacao atual.'
    });
  }

  if ((holding.allocationPct ?? 0) >= 20) {
    attention.push({
      code: 'high_concentration',
      title: 'Concentracao alta',
      body: 'Este investimento concentra uma parte grande da carteira. Se nao for intencional, pode aumentar risco e dependencia.'
    });
  } else if ((holding.allocationPct ?? 0) > 0) {
    positive.push({
      code: 'healthy_allocation',
      title: 'Peso sob controle',
      body: 'O peso desta posicao parece controlado dentro da carteira (sem concentracao extrema).'
    });
  }

  if (holding.performancePct != null && holding.performancePct <= -10) {
    attention.push({
      code: 'negative_performance',
      title: 'Performance negativa relevante',
      body: 'O ativo esta com queda material em relacao ao preco medio. Considere revisar tese e peso na carteira.'
    });
  } else if (holding.performancePct != null && holding.performancePct >= 10) {
    positive.push({
      code: 'good_performance',
      title: 'Performance positiva',
      body: 'O investimento esta com ganho relevante em relacao ao preco medio. Considere se o peso na carteira segue coerente com sua estrategia.'
    });
  }

  const hasGuardrails = holding.stopLoss != null || holding.targetPrice != null;
  if ((holding.allocationPct ?? 0) >= 15 && !hasGuardrails) {
    attention.push({
      code: 'no_risk_guardrails',
      title: 'Sem guardrails de risco',
      body: 'Para uma posicao relevante, pode fazer sentido definir limite de perda (stop) ou alvo para orientar decisao sem emocional.'
    });
  } else if (hasGuardrails) {
    positive.push({
      code: 'has_guardrails',
      title: 'Guardrails definidos',
      body: 'Ha stop/alvo configurado, o que ajuda a reduzir decisao emocional em movimentos de mercado.'
    });
  }

  return { attention: attention.slice(0, 5), positive: positive.slice(0, 5) };
}
