import type { Env } from '../types/env';

export type AiResult = { text: string; provider: 'openai' | 'gemini' };
export type AiDiagnostics = { openai?: string; gemini?: string };

export async function generateAiTextWithFallback(env: Env, input: {
  prompt: string;
  maxTokens?: number;
}): Promise<AiResult | null> {
  const prompt = input.prompt.trim();
  if (!prompt) return null;

  const openaiKey = env.OPENAI_API_KEY || '';
  if (openaiKey) {
    const text = await tryOpenAi(openaiKey, prompt, input.maxTokens ?? 280).catch(() => '');
    if (text) return { text, provider: 'openai' };
  }

  const geminiKey = env.GEMINI_API_KEY || '';
  if (geminiKey) {
    const text = await tryGemini(geminiKey, prompt, input.maxTokens ?? 280).catch(() => '');
    if (text) return { text, provider: 'gemini' };
  }

  return null;
}

export async function generateAiTextWithFallbackDetailed(env: Env, input: {
  prompt: string;
  maxTokens?: number;
}): Promise<{ result: AiResult | null; diagnostics: AiDiagnostics }> {
  const prompt = input.prompt.trim();
  if (!prompt) return { result: null, diagnostics: {} };

  const diagnostics: AiDiagnostics = {};

  const openaiKey = env.OPENAI_API_KEY || '';
  if (openaiKey) {
    try {
      const text = await tryOpenAi(openaiKey, prompt, input.maxTokens ?? 280);
      if (text) return { result: { text, provider: 'openai' }, diagnostics };
      diagnostics.openai = 'openai_empty';
    } catch (error) {
      diagnostics.openai = toDiag('openai', error);
    }
  }

  const geminiKey = env.GEMINI_API_KEY || '';
  if (geminiKey) {
    try {
      const text = await tryGemini(geminiKey, prompt, input.maxTokens ?? 280);
      if (text) return { result: { text, provider: 'gemini' }, diagnostics };
      diagnostics.gemini = 'gemini_empty';
    } catch (error) {
      diagnostics.gemini = toDiag('gemini', error);
    }
  }

  return { result: null, diagnostics };
}

async function tryOpenAi(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: prompt,
        max_output_tokens: maxTokens
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      const detail = await safeResponseMessage(res);
      throw new Error(detail ? `openai_http_${res.status}:${detail}` : `openai_http_${res.status}`);
    }
    const data = (await res.json()) as any;
    const direct = typeof data.output_text === 'string' ? data.output_text : '';
    if (direct.trim()) return direct.trim();
    // Fallback: tenta extrair do formato output[].
    const output = Array.isArray(data.output) ? data.output : [];
    for (const item of output) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const part of content) {
        if (part?.type === 'output_text' && typeof part?.text === 'string' && part.text.trim()) return part.text.trim();
        if (typeof part?.text === 'string' && part.text.trim()) return part.text.trim();
      }
    }
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

async function tryGemini(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  const tries = [
    { api: 'v1', model: 'gemini-1.5-flash' },
    { api: 'v1beta', model: 'gemini-1.5-flash' },
    { api: 'v1', model: 'gemini-1.5-flash-latest' },
    { api: 'v1beta', model: 'gemini-1.5-flash-latest' },
    { api: 'v1', model: 'gemini-2.0-flash' },
    { api: 'v1beta', model: 'gemini-2.0-flash' }
  ] as const;

  let lastError: unknown = null;
  for (const entry of tries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const url = `https://generativelanguage.googleapis.com/${entry.api}/models/${encodeURIComponent(entry.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 }
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const detail = await safeResponseMessage(res);
        // 404 aqui pode ser endpoint/modelo; tentamos proximo.
        if (res.status === 404) {
          lastError = new Error(detail ? `gemini_http_404:${detail}` : 'gemini_http_404');
          continue;
        }
        throw new Error(detail ? `gemini_http_${res.status}:${detail}` : `gemini_http_${res.status}`);
      }

      const data = (await res.json()) as any;
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      const parts = candidates[0]?.content?.parts;
      if (Array.isArray(parts) && typeof parts[0]?.text === 'string') return String(parts[0].text).trim();
      return '';
    } catch (error) {
      lastError = error;
      // Erros diferentes de 404 (ex: 401/403/429) nao vao melhorar com outro modelo.
      const msg = error instanceof Error ? error.message : String(error);
      if (!String(msg).includes('gemini_http_404')) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('gemini_http_404');
}

function toDiag(provider: 'openai' | 'gemini', error: unknown): string {
  if (error instanceof Error) {
    const msg = String(error.message || '').trim();
    if (msg) return msg.slice(0, 120);
    return `${provider}_error`;
  }
  return `${provider}_error_${String(error).slice(0, 120)}`;
}

async function safeResponseMessage(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as any;
      const msg = data?.error?.message || data?.message || '';
      return typeof msg === 'string' ? msg.trim().slice(0, 160) : '';
    }
    const text = await res.text();
    return String(text || '').trim().slice(0, 160);
  } catch {
    return '';
  }
}

