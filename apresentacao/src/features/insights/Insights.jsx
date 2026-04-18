import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart2, Zap,
  ArrowRight, CheckCircle2, AlertTriangle,
  Info, X, Target
} from 'lucide-react';
import EstadoVazio from '../../components/feedback/EstadoVazio';
import { formatarData } from '../../utils/formatarData';
import { ApiError, insightsApi, telemetriaApi, avaliarComVera } from '../../cliente-api';
import { cache } from '../../utils/cache';
import { useNavigate } from 'react-router-dom';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { VeraCard } from '../vera/VeraCard';

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
const INSIGHTS_CACHE_TTL = 300 * 1000; // 5 min

export default function Insights() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(() => !cache.get(INSIGHTS_CACHE_KEY, INSIGHTS_CACHE_TTL));
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(() => cache.get(INSIGHTS_CACHE_KEY, INSIGHTS_CACHE_TTL) ?? null);
  const [veraPayload, setVeraPayload] = useState(null);

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

        // Call Vera for financial evaluation
        try {
          const veraRequest = {
            profile: {
              monthly_income: dados?.contextoFinanceiro?.rendaMensal
                ? { value: dados.contextoFinanceiro.rendaMensal, state: 'HAS_VALUE' }
                : undefined,
              monthly_expenses: dados?.contextoFinanceiro?.gastoMensal
                ? { value: dados.contextoFinanceiro.gastoMensal, state: 'HAS_VALUE' }
                : undefined,
              current_reserve: dados?.patrimonioConsolidado
                ? { value: dados.patrimonioConsolidado, state: 'HAS_VALUE' }
                : undefined,
              debt_total: dados?.contextoFinanceiro?.dividas
                ? { value: dados.contextoFinanceiro.dividas.reduce((sum, d) => sum + (d.saldoDevedor || 0), 0), state: 'HAS_VALUE' }
                : undefined,
              age: dados?.contextoFinanceiro?.faixaEtaria
                ? { value: parseInt(dados.contextoFinanceiro.faixaEtaria) || 30, state: 'HAS_VALUE' }
                : undefined,
              investor_profile_declared: dados?.contextoFinanceiro?.perfilRiscoDeclarado
                ? { value: dados.contextoFinanceiro.perfilRiscoDeclarado, state: 'HAS_VALUE' }
                : undefined,
            },
            history: {
              recommendations_completed: 0,
              recommendations_ignored: 0,
              recommendations_postponed: 0,
              promised_vs_actual_contribution_ratio: 0.5,
            },
          };

          const veraResponse = await avaliarComVera(veraRequest);
          if (ativo && veraResponse?.frontend_payload) {
            setVeraPayload(veraResponse.frontend_payload);
          }
        } catch (veraErr) {
          // Vera failure doesn't block the UI
          console.warn('[Vera] Failed to load evaluation:', veraErr);
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
  const patrimonio = resumo?.patrimonioConsolidado || resumo?.patrimonio_consolidado;
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

        {/* 4.1 — Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
            <BarChart2 size={24} />
          </div>
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-4">O que encontramos na sua carteira</h1>
          <p className="text-[#0B1218]/40 text-sm font-medium max-w-xl">
            Análise baseada nos seus dados e no seu perfil de investidor.
          </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-16">
            {/* Coluna principal — cards */}
            <div className="space-y-6">
              {/* Vera evaluation card */}
              {veraPayload && (
                <VeraCard
                  payload={veraPayload}
                  onAction={(action, payload) => {
                    void telemetriaApi.registrarEventoTelemetria('vera_cta_clicked', { action, payload });
                    navigate(action === 'OPEN_RESERVE_FLOW' ? '/decisoes' : action === 'OPEN_GOAL_REVIEW' ? '/decisoes' : '/decisoes');
                  }}
                />
              )}

              {confiancaDiagnostico !== 'alta' && (
                <div className="p-5 border border-[#F2C94C]/30 bg-[#F2C94C]/8 rounded-xl">
                  <p className="text-[11px] font-semibold text-[#0B1218]/80">
                    Leitura com confiança limitada: dados de mercado {atualizacaoMercado?.statusGeral || atualizacaoMercado?.status_geral || 'indisponíveis'}.
                  </p>
                </div>
              )}
              {cards.map((card) => (
                <InsightCard
                  key={card.title}
                  {...card}
                  onAction={() => {
                    void telemetriaApi.registrarEventoTelemetria('recommendation_clicked', { titulo: card.title, acao: card.action });
                    navigate(card.actionUrl ?? '/decisoes');
                  }}
                />
              ))}
            </div>

            {/* 4.3 — Sidebar Score */}
            <aside className="space-y-8">
              <div className="bg-[#0B1218] p-8 text-white rounded-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Target size={18} className="text-[#F56A2A]" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Score de Saúde</h4>
                </div>

                {/* Número + badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-['Sora'] text-5xl font-bold">{ocultarValores ? '••••••••' : scoreValor}</span>
                  {badgeScore && (
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-xl"
                      style={{ background: badgeScore.bg, color: badgeScore.color }}
                    >
                      {badgeScore.label}
                    </span>
                  )}
                </div>

                {/* Barra */}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[#F56A2A]" style={{ width: `${Math.max(0, Math.min(100, (scoreValor / scoreMaximo) * 100))}%` }} />
                </div>
                <p className="text-[10px] text-white/40 mb-1">
                  {ocultarValores ? '••••••••' : `${Math.round((scoreValor / scoreMaximo) * 100)}% do máximo possível`}
                </p>

                {scoreStatus !== 'complete' && (
                  <p className="text-[10px] uppercase tracking-widest text-white/45 mb-4">
                    {scoreStatus === 'empty' ? 'Dados insuficientes: score zerado' : 'Dados parciais: leitura conservadora'}
                  </p>
                )}

                {/* Pilares do score unificado */}
                {scoreUnificado?.pillars?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">O que compõe seu score</p>
                    <ul className="space-y-4">
                      {scoreUnificado.pillars.map((pilar) => (
                        <li key={pilar.id}>
                          <div className="flex justify-between text-xs font-medium text-white/60 mb-1.5">
                            <span>{pilar.name}</span>
                            <span className="font-bold text-white/80">
                              {ocultarValores ? '••••••••' : <>{pilar.score}<span className="text-white/30"> /1000</span></>}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-white/10 overflow-hidden rounded-full">
                            <div className="h-full bg-[#F56A2A] transition-all" style={{ width: `${Math.round((pilar.score / 1000) * 100)}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timestamp */}
                {timestampScore && (
                  <p className="text-[10px] text-white/30 mt-6">
                    Atualizado {isHoje(timestampScore) ? 'hoje' : formatarData(timestampScore)} às {formatarHoraSimples(timestampScore)}
                  </p>
                )}
              </div>

              {/* 4.4 — O que está pesando no score */}
              {resumo.diagnostico?.riscos?.length > 0 && (
                <div className="border border-[#EFE7DC] p-8 rounded-xl">
                  <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-5">O que está pesando no seu score</h4>
                  <ul className="space-y-4">
                    {resumo.diagnostico.riscos.map((risco) => {
                      const cor = COR_SEVERIDADE[risco.severidade] ?? '#0B1218';
                      return (
                        <li key={risco.codigo} className="flex gap-3">
                          <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: cor }} />
                          <div>
                            <p className="text-[13px] font-bold text-[#0B1218]">{risco.titulo}</p>
                            <p className="text-xs text-[#0B1218]/55 mt-0.5 leading-relaxed">{risco.descricao}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 4.5 — Patrimônio Consolidado */}
              {patrimonio && (
                <div className="border border-[#EFE7DC] p-8 rounded-xl">
                  <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-5">Patrimônio Consolidado</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0B1218]/60">Patrimônio bruto</span>
                      <span className="font-medium text-[#0B1218]">{ocultarValores ? '••••••••' : moeda(patrimonio.patrimonioBruto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0B1218]/40">(−) Dívidas e passivos</span>
                      <span className="text-[#0B1218]/50">{ocultarValores ? '••••••••' : moeda(patrimonio.passivoTotal)}</span>
                    </div>
                    <div className="border-t border-[#EFE7DC] pt-2 flex justify-between text-sm">
                      <span className="font-bold text-[#0B1218]">Patrimônio líquido</span>
                      <span className="font-['Sora'] font-bold text-[#0B1218]">{ocultarValores ? '••••••••' : moeda(patrimonio.patrimonioLiquido)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Impacto de decisões recentes */}
              {resumo.impactoDecisoesRecentes?.quantidade > 0 && (
                <div className="border border-[#EFE7DC] p-8 rounded-xl bg-[#FDFCFB]">
                  <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-3">Impacto das decisões recentes</h4>
                  <p className="text-xs text-[#0B1218]/65 leading-relaxed">
                    {ocultarValores
                      ? 'Efeito recente: ••••••••'
                      : `${resumo.impactoDecisoesRecentes.deltaTotal >= 0 ? 'Efeito positivo' : 'Efeito negativo'} de ${resumo.impactoDecisoesRecentes.deltaTotal.toFixed(1)} pontos no score em ${resumo.impactoDecisoesRecentes.quantidade} simulações salvas.`}
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}

      </div>
    </div>
  );
}
