import React, { useEffect, useState } from 'react';
import { insightsApi, telemetriaApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useVeraEvaluation } from './hooks/useVeraEvaluation';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ScoreSemiCircle } from './components/ScoreSemiCircle';

export default function InsightsMobile() {
  const navigate = useNavigate();
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

  const handleVeraCta = async () => {
    if (!veraPayload?.cta?.action) {
      navigate('/decisoes');
      return;
    }

    const action = veraPayload.cta.action;
    void telemetriaApi.registrarEventoTelemetria('vera_cta_clicked_mobile', {
      action,
      decision_type: veraPayload.decision_type
    });

    switch (action) {
      case 'OPEN_RESERVE_FLOW':
        navigate('/decisoes');
        break;
      case 'OPEN_DEBT_FLOW':
        navigate('/decisoes');
        break;
      case 'OPEN_GOAL_REVIEW':
        navigate('/decisoes');
        break;
      default:
        navigate('/decisoes');
    }
  };

  const scoreUnificado = resumo?.scoreUnificado || resumo?.score_unificado;
  const score = scoreUnificado?.score ?? 0;
  const bandaScore = scoreUnificado?.band;

  const BADGE_SCORE = {
    critical: { bg: 'rgba(232,92,92,0.12)', color: '#E85C5C', label: 'Crítico' },
    fragile: { bg: 'rgba(242,201,76,0.15)', color: '#B8880A', label: 'Frágil' },
    stable: { bg: '#EFE7DC', color: '#0B1218', label: 'Estável' },
    good: { bg: 'rgba(111,207,151,0.15)', color: '#1A7A45', label: 'Bom' },
    strong: { bg: 'rgba(111,207,151,0.25)', color: '#1A7A45', label: 'Sólido' },
  };
  const badgeScore = bandaScore ? BADGE_SCORE[bandaScore] : null;

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
          {/* Score Card */}
          <div className="rounded-xl bg-[#0B1218] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Score</p>
            <ScoreSemiCircle score={score} maxScore={1000} ocultarValores={ocultarValores} />
            {badgeScore && (
              <div className="mt-4 mx-auto w-fit px-3 py-1 text-xs font-bold rounded-full" style={{ background: badgeScore.bg, color: badgeScore.color }}>
                {badgeScore.label}
              </div>
            )}
          </div>

          {/* Three-Card Layout: Problem / Why / How */}
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
                  <p className="text-xs text-[#0B1218] mb-3">{veraSections.how}</p>
                  <button
                    onClick={handleVeraCta}
                    className="text-[#1A7A45] text-xs font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    {veraPayload.cta?.label || 'Executar'} <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Full Explanation Section */}
          {veraPayload?.title && (
            <div className="rounded-xl bg-white p-4 border border-[var(--border-color)]">
              <h2 className="text-sm font-bold text-[#0B1218] mb-2">{veraPayload.title}</h2>
              <p className="text-xs text-[#0B1218]/80 leading-relaxed">{veraPayload.body}</p>
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

