import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, AlertTriangle, Info, X
} from 'lucide-react';
import EstadoVazio from '../../components/feedback/EstadoVazio';
import { formatarData } from '../../utils/formatarData';
import { ApiError, insightsApi, telemetriaApi } from '../../cliente-api';
import { cache } from '../../utils/cache';
import { useNavigate } from 'react-router-dom';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useVeraEvaluation } from './hooks/useVeraEvaluation';
import { ScoreSemiCircle } from './components/ScoreSemiCircle';

const moeda = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarHoraSimples = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
};

const isHoje = (iso) => {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const hoje = new Date();
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  } catch {
    return false;
  }
};

// --- Badge de score (igual ao sistema definido em 1.2) ---
const BADGE_SCORE = {
  critico:   { bg: 'rgba(232,92,92,0.12)',   color: '#E85C5C', label: 'Crítico' },
  baixo:     { bg: 'rgba(242,201,76,0.15)',  color: '#B8880A', label: 'Atenção' },
  ok:        { bg: '#EFE7DC',                color: '#0B1218', label: 'Regular' },
  bom:       { bg: 'rgba(111,207,151,0.15)', color: '#1A7A45', label: 'Bom' },
  excelente: { bg: 'rgba(111,207,151,0.25)', color: '#1A7A45', label: 'Excelente' },
};

const SEVERIDADE_IMPACTO = {
  alto:  'Impacto alto no seu score',
  medio: 'Impacto moderado no seu score',
  baixo: 'Impacto pequeno no seu score',
};

const COR_SEVERIDADE = {
  alto:  '#E85C5C',
  medio: '#B8880A',
  baixo: '#0B1218',
};

// --- Componentes Base ---

const ExplainerTooltip = ({ title, content, onClose }) => (
  <div className="absolute z-[100] mt-2 w-72 bg-white border border-[#EFE7DC] shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95 duration-200">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-['Sora'] text-xs font-bold text-[#0B1218] uppercase tracking-tight">{title}</h4>
      <button onClick={onClose} className="text-[#0B1218]/20 hover:text-[#E85C5C] transition-colors cursor-pointer">
        <X size={14} />
      </button>
    </div>
    <p className="text-[12px] leading-relaxed text-[#0B1218]/60 font-medium">{content}</p>
  </div>
);

const InfoTrigger = ({ title, text }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 text-[#0B1218]/10 hover:text-[#f56a2a] transition-colors cursor-pointer"
      >
        <Info size={14} />
      </button>
      {isOpen && <ExplainerTooltip title={title} content={text} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

const InsightCard = ({ type, severity, title, description, impact, action, infoTitle, infoText, onAction }) => {
  let theme = { icon: <Zap size={20} />, color: 'text-[#F56A2A]', bg: 'bg-[var(--bg-card)]', border: 'border-[var(--border-color)]', borderL: 'border-l-4 border-l-[#F56A2A]' };
  let typeLabel = 'Oportunidade';

  if (type === 'positive') {
    theme = { icon: <CheckCircle2 size={20} />, color: 'text-[#1A7A45]', bg: 'bg-[var(--bg-card)]', border: 'border-[var(--border-color)]', borderL: 'border-l-4 border-l-[#1A7A45]' };
    typeLabel = 'Isso está indo bem';
  } else if (type === 'alert') {
    if (severity === 'alto' || severity === 'critico') {
      theme = { icon: <AlertTriangle size={20} />, color: 'text-[#E85C5C]', bg: 'bg-[var(--bg-card)]', border: 'border-[#E85C5C]/30', borderL: 'border-l-8 border-l-[#E85C5C]' };
      typeLabel = 'Ação necessária';
    } else if (severity === 'medio') {
      theme = { icon: <AlertTriangle size={20} />, color: 'text-[#B8880A]', bg: 'bg-[var(--bg-card)]', border: 'border-[#F2C94C]/30', borderL: 'border-l-4 border-l-[#F2C94C]' };
      typeLabel = 'Atenção';
    } else {
      theme = { icon: <AlertTriangle size={20} />, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-card)]', border: 'border-[var(--border-color)]', borderL: 'border-l-4 border-l-[#0B1218]' };
      typeLabel = 'Observação';
    }
  }

  return (
    <div className={`p-8 border ${theme.border} ${theme.borderL} ${theme.bg} mb-6 transition-all hover:shadow-sm rounded-xl`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-3 ${theme.color}`}>
          {theme.icon}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{typeLabel}</span>
        </div>
        <InfoTrigger title={infoTitle} text={infoText} />
      </div>
      <h3 className="font-['Sora'] text-xl font-bold text-[var(--text-primary)] mb-3">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-2xl">{description}</p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[var(--border-color)]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          <span className="text-[var(--text-primary)]">{impact}</span>
        </div>
        <button onClick={onAction} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F56A2A] hover:gap-3 transition-all">
          {action} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

// Resolve URL de navegação a partir do código do insight
const resolverUrlAcao = (codigo) => {
  if (!codigo) return '/decisoes';
  const c = String(codigo).toUpperCase();
  if (c.startsWith('CONC_') || c.startsWith('DIV_')) return '/carteira';
  return '/decisoes';
};

const INSIGHTS_CACHE_KEY = 'insights_resumo';
const INSIGHTS_CACHE_TTL = 15 * 60 * 1000; // 15 min - reduz reprocessamento desnecessário

export default function Insights() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const { veraPayload, avaliar: avaliarComVera } = useVeraEvaluation();
  const [loading, setLoading] = useState(() => !cache.get(INSIGHTS_CACHE_KEY, INSIGHTS_CACHE_TTL));
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(() => cache.get(INSIGHTS_CACHE_KEY, INSIGHTS_CACHE_TTL) ?? null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const cached = cache.get(INSIGHTS_CACHE_KEY, INSIGHTS_CACHE_TTL);
        if (cached) {
          setResumo(cached);
          setLoading(false);
          // atualiza em background sem mostrar loading
          void (async () => {
            try {
              const dados = await insightsApi.obterResumo();
              if (ativo) {
                cache.set(INSIGHTS_CACHE_KEY, dados);
                setResumo(dados);
              }
            } catch { /* silencioso */ }
          })();
          return;
        }
        setLoading(true);
        setError('');
        const dados = await insightsApi.obterResumo();
        if (ativo) cache.set(INSIGHTS_CACHE_KEY, dados);
        if (!ativo) return;
        setResumo(dados);
        await telemetriaApi.registrarEventoTelemetria('insight_opened', { score: dados?.score?.score ?? 0 });

        // Trigger Vera evaluation in background
        if (ativo) {
          void avaliarComVera(dados);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setError('Falha ao carregar insights.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [navigate]);

  const cards = useMemo(() => {
    if (!resumo) return [];
    const lista = [];

    if (resumo.riscoPrincipal) {
      const sev = resumo.riscoPrincipal.severidade;
      lista.push({
        type: 'alert',
        severity: sev,
        title: resumo.riscoPrincipal.titulo,
        description: resumo.riscoPrincipal.descricao,
        impact: SEVERIDADE_IMPACTO[sev] ?? 'Impacto no seu score',
        action: 'Ver na carteira',
        actionUrl: resolverUrlAcao(resumo.riscoPrincipal.codigo),
        infoTitle: 'O que esse indicador mede',
        infoText: resumo.riscoPrincipal.descricao || 'Identificador de concentração e risco da carteira.',
      });
    }

    if (resumo.acaoPrioritaria) {
      lista.push({
        type: 'opportunity',
        title: resumo.acaoPrioritaria.titulo,
        description: resumo.acaoPrioritaria.descricao,
        impact: resumo.acaoPrioritaria.impactoEsperado || 'Melhora estrutural da carteira',
        action: 'Ver recomendação',
        actionUrl: resolverUrlAcao(resumo.acaoPrioritaria.codigo),
        infoTitle: 'O que essa recomendação resolve',
        infoText: resumo.acaoPrioritaria.descricao || 'Ação sugerida com base no seu perfil e carteira atual.',
      });
    }

    if (resumo.insightPrincipal) {
      lista.push({
        type: 'opportunity',
        title: resumo.insightPrincipal.titulo,
        description: resumo.insightPrincipal.descricao,
        impact: resumo.classificacao ? SEVERIDADE_IMPACTO[resumo.classificacao] ?? 'Melhora estrutural da carteira' : 'Melhora estrutural da carteira',
        action: resumo.insightPrincipal.acao || 'Explorar',
        actionUrl: '/decisoes',
        infoTitle: 'Como esse insight foi gerado',
        infoText: 'Baseado na penalidade de maior peso do cálculo do seu score.',
      });
    }

    if (resumo.diagnostico) {
      lista.push({
        type: ['critico', 'baixo'].includes(resumo.classificacao ?? '') ? 'alert' : 'positive',
        title: 'Diagnóstico consolidado',
        description: resumo.diagnosticoFinal?.mensagem || resumo.diagnostico.resumo,
        impact: SEVERIDADE_IMPACTO[resumo.classificacao] ?? 'Visão geral da sua carteira',
        action: 'Explorar carteira',
        actionUrl: '/carteira',
        infoTitle: 'Como o diagnóstico é calculado',
        infoText: `Baseado no motor de regras. Último cálculo: ${formatarData(resumo.score?.atualizadoEm)}.`,
      });
    }

    return lista;
  }, [resumo]);

  const confiancaDiagnostico = resumo?.confiancaDiagnostico || resumo?.confianca_diagnostico || 'alta';
  const atualizacaoMercado = resumo?.atualizacaoMercado || resumo?.atualizacao_mercado;
  const dadosMercadoSessao = resumo?.dadosMercadoSessao || resumo?.dados_mercado_sessao;
  const scoreUnificado = resumo?.scoreUnificado || resumo?.score_unificado;
  // Score sempre no sistema unificado (0-1000). Nunca usar o legado (0-100).
  const scoreValor = scoreUnificado?.score ?? 0;
  const scoreMaximo = 1000;
  const scoreStatus = scoreUnificado?.completenessStatus || (scoreUnificado ? 'complete' : 'empty');
  const semBaseInsights = !loading && !error && resumo && !scoreUnificado;
  // Badge baseado na faixa do score unificado
  const bandaUnificada = scoreUnificado?.band ?? null;
  const BADGE_UNIFICADO = {
    critical: { bg: 'rgba(232,92,92,0.12)', color: '#E85C5C', label: 'Crítico' },
    fragile:  { bg: 'rgba(242,201,76,0.15)', color: '#B8880A', label: 'Frágil' },
    stable:   { bg: '#EFE7DC', color: '#0B1218', label: 'Estável' },
    good:     { bg: 'rgba(111,207,151,0.15)', color: '#1A7A45', label: 'Bom' },
    strong:   { bg: 'rgba(111,207,151,0.25)', color: '#1A7A45', label: 'Sólido' },
  };
  const badgeScore = bandaUnificada ? BADGE_UNIFICADO[bandaUnificada] ?? null : null;
  const classificacao = resumo?.classificacao || null;
  const timestampScore = scoreUnificado?.calculatedAt || dadosMercadoSessao?.timestamp || resumo?.score?.atualizadoEm;

  return (
    <div className="w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)]">
      <div className="w-full">

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight">Insights</h1>
        </div>

        {loading && <p className="text-sm text-[#0B1218]/50 mb-6">Carregando sua análise...</p>}
        {error && <p className="text-sm text-[#E85C5C] mb-6">Não conseguimos carregar sua análise. Tente novamente.</p>}
        {!loading && !error && !resumo && <p className="text-sm text-[#0B1218]/50 mb-6">Sem dados disponíveis no momento.</p>}

        {/* 4.6 — Estado sem dados */}
        {semBaseInsights && (
          <EstadoVazio 
            titulo="Veja seu diagnóstico"
            descricao="Importe sua carteira para ver a análise completa de riscos e alocação. Com os dados importados, seu score estará disponível aqui."
            acaoTexto="Importar Extrato"
            onAcao={() => navigate('/home', { state: { openQuickModal: 'quick_importar' } })}
          />
        )}

        {!loading && !error && resumo && !semBaseInsights && (
          <div className="space-y-12">
            {/* Row 1: Score + 3 Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Score Card com meia lua */}
              <div className="bg-[#0B1218] rounded-xl p-6 text-white flex flex-col items-center justify-center">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Score</p>
                <ScoreSemiCircle score={scoreValor} maxScore={1000} ocultarValores={ocultarValores} />
                {badgeScore && (
                  <div className="mt-4 px-3 py-1 text-xs font-bold rounded-full" style={{ background: badgeScore.bg, color: badgeScore.color }}>
                    {badgeScore.label}
                  </div>
                )}
              </div>

              {/* Card 1: Problema */}
              {resumo.riscoPrincipal && (
                <div className="border border-[#E85C5C]/30 bg-white rounded-xl p-6 flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E85C5C] mb-2">O Problema</p>
                  <h3 className="font-['Sora'] text-base font-bold text-[#0B1218] mb-3">{resumo.riscoPrincipal.titulo}</h3>
                  <p className="text-xs text-[#0B1218]/70 mb-4 flex-grow">{resumo.riscoPrincipal.descricao}</p>
                  <button
                    onClick={() => {
                      void telemetriaApi.registrarEventoTelemetria('problema_action', { titulo: resumo.riscoPrincipal.titulo });
                      navigate(resolverUrlAcao(resumo.riscoPrincipal.codigo));
                    }}
                    className="text-[#E85C5C] text-xs font-bold hover:gap-1 inline-flex items-center gap-1 transition-all"
                  >
                    Ver mais <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* Card 2: Porque (if available) */}
              {resumo.diagnostico && (
                <div className="border border-[#B8880A]/30 bg-white rounded-xl p-6 flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B8880A] mb-2">Porque</p>
                  <h3 className="font-['Sora'] text-base font-bold text-[#0B1218] mb-3">
                    {resumo.diagnostico.titulo || resumo.diagnosticoFinal?.titulo || 'Análise de risco'}
                  </h3>
                  <p className="text-xs text-[#0B1218]/70 mb-4 flex-grow">
                    {resumo.diagnostico.resumo || resumo.diagnosticoFinal?.resumo || resumo.diagnostico.descricao}
                  </p>
                  <button
                    onClick={() => navigate('/carteira')}
                    className="text-[#B8880A] text-xs font-bold hover:gap-1 inline-flex items-center gap-1 transition-all"
                  >
                    Entender <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* Card 3: O que fazer */}
              {resumo.acaoPrioritaria && (
                <div className="border border-[#1A7A45]/30 bg-white rounded-xl p-6 flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A7A45] mb-2">O que Fazer</p>
                  <h3 className="font-['Sora'] text-base font-bold text-[#0B1218] mb-3">{resumo.acaoPrioritaria.titulo}</h3>
                  <p className="text-xs text-[#0B1218]/70 mb-4 flex-grow">{resumo.acaoPrioritaria.descricao}</p>
                  <button
                    onClick={() => {
                      void telemetriaApi.registrarEventoTelemetria('acao_prioritaria_clicked', { titulo: resumo.acaoPrioritaria.titulo });
                      navigate(resolverUrlAcao(resumo.acaoPrioritaria.codigo));
                    }}
                    className="text-[#1A7A45] text-xs font-bold hover:gap-1 inline-flex items-center gap-1 transition-all"
                  >
                    Executar <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Detailed Explanation */}
            {resumo.diagnosticoFinal?.mensagem && (
              <div className="bg-white rounded-xl p-8 border border-[var(--border-color)]">
                <h2 className="font-['Sora'] text-xl font-bold text-[#0B1218] mb-4">O que você precisa saber</h2>
                <p className="text-sm text-[#0B1218]/70 leading-relaxed mb-6">
                  {resumo.diagnosticoFinal.mensagem}
                </p>

                {resumo.acaoPrioritaria?.impactoEsperado && (
                  <div className="border-t border-[var(--border-color)] pt-6">
                    <h3 className="font-semibold text-sm text-[#0B1218] mb-2">Próximos passos</h3>
                    <p className="text-sm text-[#0B1218]/70">
                      {resumo.acaoPrioritaria.impactoEsperado}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Row 3: Source Attribution */}
            {veraPayload && (
              <div className="text-xs text-[#0B1218]/50 text-center pt-4 border-t border-[var(--border-color)]">
                <span>
                  Análise por{' '}
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
          </div>
        )}

      </div>
    </div>
  );
}
