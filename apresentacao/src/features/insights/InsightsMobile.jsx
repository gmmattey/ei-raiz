import React, { useEffect, useState } from 'react';
import { insightsApi, telemetriaApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useVeraEvaluation } from './hooks/useVeraEvaluation';

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
        const dados = await insightsApi.obterResumo();
        if (!ativo) return;
        setResumo(dados);
        setErro('');
        await telemetriaApi.registrarEventoTelemetria('insight_opened_mobile', { score: dados?.score?.score ?? 0 });

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

          {/* Source Attribution */}
          {veraPayload && (
            <div className="text-xs text-[#0B1218]/50 text-center pt-4 border-t border-[var(--border-color)]">
              <span>
                Por{' '}
                <span className="font-semibold text-[#0B1218]/70">
                  {veraPayload.source === 'cloudflare' ? 'Vera Cloudflare LLM' :
                   veraPayload.source === 'openai' ? 'Vera OpenAI' :
                   veraPayload.source === 'gemini' ? 'Vera Gemini' :
                   veraPayload.source === 'anthropic' ? 'Vera Claude' :
                   'Vera IA'}
                </span>
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

