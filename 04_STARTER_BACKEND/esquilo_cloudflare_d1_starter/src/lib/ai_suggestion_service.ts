import type { Env } from '../types/env';
import { generateAiTextWithFallbackDetailed } from './ai_provider';
import { updateAnalysisMessaging } from '../repositories/analysis_write_repository';
import { recordOperationalEvent } from './operational_events_service';

export type AiSuggestionState =
  | { status: 'disabled' }
  | { status: 'ready'; text: string; provider: 'openai' | 'gemini'; generatedAt: string }
  | { status: 'error'; message: string; diagnostics?: { openai?: string; gemini?: string } };

export async function getOrGenerateAiSuggestion(env: Env, input: {
  analysisId: string;
  messagingJson: string | null;
  promptData: {
    scoreValue: number;
    scoreStatus: string;
    primaryProblemTitle: string;
    primaryActionTitle: string;
    totals: { totalEquity: number; totalInvested: number; totalProfitLoss: number; totalProfitLossPct: number };
  };
}): Promise<AiSuggestionState> {
  const hasAnyKey = Boolean((env.OPENAI_API_KEY || '').trim() || (env.GEMINI_API_KEY || '').trim());
  if (!hasAnyKey) return { status: 'disabled' };

  const parsed = safeJson(input.messagingJson);
  const existing = parsed?.aiSuggestion;
  if (existing && typeof existing.text === 'string' && existing.text.trim() && typeof existing.generatedAt === 'string') {
    return {
      status: 'ready',
      text: existing.text.trim(),
      provider: existing.provider === 'gemini' ? 'gemini' : 'openai',
      generatedAt: existing.generatedAt
    };
  }

  const prompt = buildPrompt(input.promptData);
  const { result, diagnostics } = await generateAiTextWithFallbackDetailed(env, { prompt, maxTokens: 280 });
  if (!result?.text) {
    const diagText = `${diagnostics.openai || ''} ${diagnostics.gemini || ''}`.toLowerCase();
    const isQuota = diagText.includes('http_429') || diagText.includes('quota') || diagText.includes('billing');
    await recordOperationalEvent(env, {
      userId: null,
      portfolioId: null,
      eventType: 'ai_suggestion_error',
      status: 'error',
      message: 'Falha ao gerar sugestao por IA.',
      details: { diagnostics }
    });

    // Mensagem para UI: curta, neutra e sem detalhes de provedor/quota.
    const friendly = 'Este serviço está indisponível no momento. Tente mais tarde.';
    return {
      status: 'error',
      message: friendly,
      diagnostics
    };
  }

  const generatedAt = new Date().toISOString();
  const nextMessaging = {
    ...(parsed || {}),
    aiSuggestion: { text: result.text.trim(), provider: result.provider, generatedAt }
  };
  await updateAnalysisMessaging(env, input.analysisId, JSON.stringify(nextMessaging));

  return { status: 'ready', text: result.text.trim(), provider: result.provider, generatedAt };
}

function safeJson(value: string | null): Record<string, any> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function buildPrompt(data: {
  scoreValue: number;
  scoreStatus: string;
  primaryProblemTitle: string;
  primaryActionTitle: string;
  totals: { totalEquity: number; totalInvested: number; totalProfitLoss: number; totalProfitLossPct: number };
}): string {
  return [
    'Você é um assistente financeiro do Esquilo Invest.',
    'Objetivo: explicar, de forma humana e acionável, o que observar na carteira e qual o próximo passo.',
    'Regras: não calcule score, não invente dados, não recomende ativos específicos. Use só os dados fornecidos.',
    '',
    `Patrimônio: R$ ${data.totals.totalEquity.toFixed(2)}`,
    `Investido: R$ ${data.totals.totalInvested.toFixed(2)}`,
    `Resultado: R$ ${data.totals.totalProfitLoss.toFixed(2)} (${data.totals.totalProfitLossPct.toFixed(2)}%)`,
    `Score: ${data.scoreValue} (${data.scoreStatus})`,
    `Principal problema: ${data.primaryProblemTitle}`,
    `Principal ação: ${data.primaryActionTitle}`,
    '',
    'Saída: 1 parágrafo curto + 3 bullets de próximos passos. Português do Brasil.'
  ].join('\n');
}

