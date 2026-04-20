// Atualiza cache de cotações de mercado para ativos usados pelos usuários.
// Substitui o antigo `market-refresh.job`.

import type { Env } from '../infra/bd';
import { agora, criarBd } from '../infra/bd';

interface LinhaAtivoUsado {
  id: string;
  ticker: string | null;
  cnpj: string | null;
  tipo: string;
}

export async function atualizarMercadoJob(env: Env): Promise<void> {
  const bd = criarBd(env);
  const ativos = await bd.consultar<LinhaAtivoUsado>(
    `SELECT DISTINCT a.id, a.ticker, a.cnpj, a.tipo
       FROM ativos a
       INNER JOIN patrimonio_itens p ON p.ativo_id = a.id
      WHERE p.esta_ativo = 1`,
  );

  if (ativos.length === 0) return;

  const timestamp = agora();
  const expira = new Date(Date.now() + 5 * 60_000).toISOString();

  for (const ativo of ativos) {
    const preco = await buscarPreco(ativo, env);
    if (preco == null) continue;
    await bd.executar(
      `INSERT INTO ativos_cotacoes_cache (ativo_id, fonte, cotado_em, preco_brl, expira_em, dados_json)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(ativo_id, fonte) DO UPDATE SET
         cotado_em = excluded.cotado_em,
         preco_brl = excluded.preco_brl,
         expira_em = excluded.expira_em,
         dados_json = excluded.dados_json`,
      ativo.id,
      fontePara(ativo.tipo),
      timestamp,
      preco,
      expira,
      JSON.stringify({ origem: 'job', tipo: ativo.tipo }),
    );
  }
}

function fontePara(tipo: string): string {
  if (tipo === 'fundo') return 'cvm';
  if (tipo === 'acao' || tipo === 'fii' || tipo === 'etf') return 'brapi';
  return 'manual';
}

async function buscarPreco(ativo: LinhaAtivoUsado, env: Env): Promise<number | null> {
  if (ativo.ticker && (env.BRAPI_TOKEN || env.BRAPI_BASE_URL)) {
    const base = env.BRAPI_BASE_URL ?? 'https://brapi.dev/api';
    const url = `${base}/quote/${encodeURIComponent(ativo.ticker)}?token=${env.BRAPI_TOKEN ?? ''}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const dados = await resp.json() as { results?: Array<{ regularMarketPrice?: number }> };
      const preco = dados.results?.[0]?.regularMarketPrice;
      return typeof preco === 'number' ? preco : null;
    } catch {
      return null;
    }
  }
  return null;
}
