import React, { useEffect, useState } from 'react';
import { patrimonioApi, telemetriaApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useVeraEvaluation } from './hooks/useVeraEvaluation';

const FAIXA_PARA_BAND = {
  critico: 'critical',
  baixo: 'fragile',
  medio: 'stable',
  bom: 'good',
  excelente: 'strong',
};

const composirResumoCanonico = (resumo, score) => {
  const faixa = score?.faixa ?? null;
  const scoreTotal = Number(score?.scoreTotal ?? 0);
  const calculadoEm = score?.calculadoEm ?? resumo?.atualizadoEm ?? null;
  const scoreUnificado = scoreTotal > 0 && faixa
    ? {
        score: scoreTotal,
        band: FAIXA_PARA_BAND[faixa] ?? 'stable',
        completenessStatus: 'complete',
        calculatedAt: calculadoEm,
      }
    : null;
  return {
    scoreUnificado,
    classificacao: faixa,
    score: { atualizadoEm: calculadoEm, score: scoreTotal },
    riscoPrincipal: null,
    acaoPrioritaria: null,
    insightPrincipal: null,
    diagnostico: null,
    diagnosticoFinal: null,
    atualizacaoMercado: null,
  };
};

export default function InsightsMobile() {
  const { ocultarValores } = useModoVisualizacao();
  const { veraPayload, avaliar: avaliarComVera } = useVeraEvaluation();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [resumoCanonico, score] = await Promise.all([
          patrimonioApi.obterResumo(),
          patrimonioApi.obterScore().catch(() => null),
        ]);
        if (!ativo) return;
        const dados = composirResumoCanonico(resumoCanonico, score);
        setResumo(dados);
        setErro('');
        await telemetriaApi.registrarEvento({
          nome: 'insight_opened_mobile',
          dadosJson: { score: dados?.scoreUnificado?.score ?? 0 },
        }).catch(() => null);

        // Trigger Vera evaluation in background
        void avaliarComVera(dados);
      } catch {
        if (ativo) setErro('Falha ao carregar os insights.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [avaliarComVera]);

  // Parse Vera body into sections: problem | why | how
  const parseVeraBody = (body) => {
    if (!body) return { problem: '', why: '', how: '' };
    const sections = body.split(/\n\n+/);
    return {
      problem: sections[0] || '',
      why: sections[1] || '',
      how: sections[2] || '',
    };
  };


  const veraSections = veraPayload ? parseVeraBody(veraPayload.body) : { problem: '', why: '', how: '' };

  const scoreUnificado = resumo?.scoreUnificado || resumo?.score_unificado;
  const atualizacaoMercado = resumo?.atualizacaoMercado || resumo?.atualizacao_mercado;
  const timestampScore = scoreUnificado?.calculatedAt || resumo?.score?.atualizadoEm;
  const timestampCotacoes =
    atualizacaoMercado?.ultimaAtualizacao || atualizacaoMercado?.ultima_atualizacao;
  const statusCotacoes = atualizacaoMercado?.statusGeral || atualizacaoMercado?.status_geral;
  const coberturaCotacoes = Number(atualizacaoMercado?.cobertura ?? 0);
  const fontesCotacoes = (atualizacaoMercado?.fontes || [])
    .filter((f) => f?.fonte && f.fonte !== 'nenhuma' && Number(f?.quantidade) > 0)
    .map((f) => String(f.fonte).toUpperCase());

  const formatarDataHora = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const STATUS_COTACOES_LABEL = {
    atualizado: { cor: '#1A7A45', texto: 'Cotações atualizadas' },
    atrasado: { cor: '#B8880A', texto: 'Cotações defasadas' },
    indisponivel: { cor: '#E85C5C', texto: 'Sem cotações' },
  };
  const statusLabel = statusCotacoes ? STATUS_COTACOES_LABEL[statusCotacoes] : null;

  const temOrigemParaExibir =
    timestampScore || timestampCotacoes || fontesCotacoes.length > 0 || veraPayload;

  return (
    <section className="space-y-6 pb-6">
      {/* Header */}
      <header>
        <h1 className="font-['Sora'] text-2xl font-bold text-[var(--text-primary)]">Insights</h1>
      </header>

      {loading && <p className="text-xs text-[var(--text-secondary)]">Carregando...</p>}
      {erro && <p className="text-xs text-[#E85C5C]">{erro}</p>}

      {!loading && !erro && resumo && (
        <>
          {/* Three-Card Layout: Vera if available, fallback to resumo */}
          {veraPayload && (
            <div className="space-y-4">
              {/* Problem Card */}
              {veraSections.problem && (
                <div className="rounded-xl border border-[#E85C5C]/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E85C5C] mb-2">O Problema</p>
                  <p className="text-xs text-[#0B1218]">{veraSections.problem}</p>
                </div>
              )}

              {/* Why Card */}
              {veraSections.why && (
                <div className="rounded-xl border border-[#B8880A]/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B8880A] mb-2">Por Que Importa</p>
                  <p className="text-xs text-[#0B1218]">{veraSections.why}</p>
                </div>
              )}

              {/* How Card */}
              {veraSections.how && (
                <div className="rounded-xl border border-[#1A7A45]/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A7A45] mb-2">O que Fazer</p>
                  <p className="text-xs text-[#0B1218]">{veraSections.how}</p>
                </div>
              )}
            </div>
          )}

          {/* Fallback to resumo if no veraPayload */}
          {!veraPayload && (
            <div className="space-y-4">
              {resumo.riscoPrincipal && (
                <div className="rounded-xl border border-[#E85C5C]/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E85C5C] mb-2">O Problema</p>
                  <h3 className="font-['Sora'] text-sm font-bold text-[#0B1218] mb-2">{resumo.riscoPrincipal.titulo}</h3>
                  <p className="text-xs text-[#0B1218]">{resumo.riscoPrincipal.descricao}</p>
                </div>
              )}

              {resumo.diagnostico && (
                <div className="rounded-xl border border-[#B8880A]/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B8880A] mb-2">Por Que Importa</p>
                  <h3 className="font-['Sora'] text-sm font-bold text-[#0B1218] mb-2">
                    {resumo.diagnostico.titulo || resumo.diagnosticoFinal?.titulo || 'Análise de risco'}
                  </h3>
                  <p className="text-xs text-[#0B1218]">
                    {resumo.diagnostico.resumo || resumo.diagnosticoFinal?.resumo || resumo.diagnostico.descricao}
                  </p>
                </div>
              )}

              {resumo.acaoPrioritaria && (
                <div className="rounded-xl border border-[#1A7A45]/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A7A45] mb-2">O que Fazer</p>
                  <h3 className="font-['Sora'] text-sm font-bold text-[#0B1218] mb-2">{resumo.acaoPrioritaria.titulo}</h3>
                  <p className="text-xs text-[#0B1218]">{resumo.acaoPrioritaria.descricao}</p>
                </div>
              )}
            </div>
          )}

          {/* Full Explanation Section - Vera */}
          {veraPayload?.title && (
            <div className="rounded-xl bg-white p-4 border border-[var(--border-color)]">
              <h2 className="text-sm font-bold text-[#0B1218] mb-2">{veraPayload.title}</h2>
              <p className="text-xs text-[#0B1218]/80 leading-relaxed">{veraPayload.body}</p>
            </div>
          )}

          {/* Full Explanation Section - Fallback to resumo */}
          {!veraPayload && resumo.diagnosticoFinal?.mensagem && (
            <div className="rounded-xl bg-white p-4 border border-[var(--border-color)]">
              <h2 className="text-sm font-bold text-[#0B1218] mb-2">O que você precisa saber</h2>
              <p className="text-xs text-[#0B1218]/80 leading-relaxed">{resumo.diagnosticoFinal.mensagem}</p>
            </div>
          )}

          {/* Origem dos dados — transparência do pipeline de insights */}
          {temOrigemParaExibir && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Origem dos dados
              </p>

              {timestampScore && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Score calculado</span>
                  <span className="text-[var(--text-secondary)]">{formatarDataHora(timestampScore)}</span>
                </div>
              )}

              {(timestampCotacoes || statusLabel) && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Cotações</span>
                  <span className="text-right">
                    {statusLabel && (
                      <span className="font-semibold" style={{ color: statusLabel.cor }}>
                        {statusLabel.texto}
                      </span>
                    )}
                    {timestampCotacoes && (
                      <span className="text-[var(--text-secondary)] ml-1">
                        · {formatarDataHora(timestampCotacoes)}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {coberturaCotacoes > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Cobertura</span>
                  <span className="text-[var(--text-secondary)]">
                    {coberturaCotacoes.toFixed(0)}%
                    {fontesCotacoes.length > 0 && ` · ${fontesCotacoes.join(', ')}`}
                  </span>
                </div>
              )}

              {veraPayload && (
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Narrativa</span>
                  <span className="text-[var(--text-secondary)]">
                    {veraPayload.source === 'cloudflare' ? 'Vera · Cloudflare' :
                     veraPayload.source === 'openai' ? 'Vera · OpenAI' :
                     veraPayload.source === 'gemini' ? 'Vera · Gemini' :
                     veraPayload.source === 'anthropic' ? 'Vera · Claude' :
                     'Vera IA'}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

