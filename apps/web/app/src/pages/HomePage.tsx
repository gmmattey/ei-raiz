import React from "react";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import type { DashboardHomeData } from "@/core/data/contracts";
import { Link, useLocation } from "react-router-dom";
import { LoadingState, ErrorState, BlockedState } from "@/components/system/SystemState";
import { BottomNav } from "@/components/system/BottomNav";
import { useGhostMode } from "@/core/contexts/GhostModeContext";
import { BankLogo } from "@/components/brand/BankLogo";
import { EyeIcon, EyeOffIcon, RefreshIcon } from "@/components/system/Icons";
import { PullToRefresh } from "@/components/system/PullToRefresh";

export function HomePage() {
  const { isGhostMode, toggle: toggleGhost } = useGhostMode();
  const ds = useDataSources();
  const [data, setData] = React.useState<DashboardHomeData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await ds.dashboard.getDashboardHome();
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opa, não conseguimos buscar seu resumo agora. Dá uma checada na internet!");
    }
  }, [ds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-dvh bg-bg-primary flex flex-col animate-fluid-in">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:py-16 pb-32">
          <header className="mb-12 border-b border-border-default/50 pb-10">
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Raio-X de Patrimônio</p>
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none">
                Seu Dinheiro Hoje
              </h1>
              <div className="flex items-center gap-1 md:gap-3">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`p-3 rounded-full hover:bg-bg-secondary transition-all text-text-secondary hover:text-brand-primary ${refreshing ? 'animate-spin' : ''}`}
                  title="Atualizar dados"
                >
                  <RefreshIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button 
                  onClick={toggleGhost}
                  className="p-3 rounded-full hover:bg-bg-secondary transition-colors text-text-secondary hover:text-brand-primary"
                  title={isGhostMode ? "Mostrar valores" : "Esconder valores"}
                >
                  {isGhostMode ? <EyeOffIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                </button>
              </div>
            </div>

          {error ? (
            <div className="mt-10">
              <ErrorState
                title="Eita, deu um problema no painel"
                body={error}
                ctaLabel="Tentar de novo"
                ctaTarget="/app/home"
                secondaryCtaLabel="Ver meu perfil"
                secondaryCtaTarget="/app/profile"
              />
            </div>
          ) : !data ? (
            <div className="mt-10">
              <LoadingState
                title="Buscando seus papéis..."
                body="Estamos organizando a casa para você ver tudo de uma vez."
              />
            </div>
          ) : data.screenState === "redirect_onboarding" ? (
            <div className="mt-10">
              <BlockedState
                title="Falta só um passinho..."
                body="Complete seu cadastro básico para a gente conseguir analisar sua carteira de verdade."
                ctaLabel="Bora Terminar"
                ctaTarget={normalizeAppTarget(data.redirectTo)}
                secondaryCtaLabel="Importar Planilha"
                secondaryCtaTarget="/app/import"
              />
            </div>
          ) : (
            <div className="mt-12 flex flex-col gap-14">
              
              {/* Avisos de Estado (Linguagem Humana) */}
              {data.screenState === "empty" ? (
                <div className="border-l-4 border-brand-primary bg-brand-primary/5 p-6 rounded-r-xl">
                  <p className="text-[14px] font-bold text-brand-primary uppercase tracking-wide mb-1">Atenção</p>
                  <p className="text-[16px] text-text-secondary">Sua carteira ainda está vazia. Importe seus ativos para desbloquear esse painel!</p>
                </div>
              ) : data.screenState === "portfolio_ready_analysis_pending" ? (
                <div className="border-l-4 border-state-success bg-state-success/5 p-6 rounded-r-xl">
                  <p className="text-[14px] font-bold text-state-success uppercase tracking-wide mb-1">Quase lá</p>
                  <p className="text-[16px] text-text-secondary">Seus ativos já estão aqui! Nossa IA só está terminando de ler os detalhes técnicos para você.</p>
                </div>
              ) : null}

              {/* Bloco de Valores (Premium Typography) */}
              <div className="grid gap-12 md:grid-cols-3 items-end">
                <div className="md:col-span-2">
                  <p className="text-[13px] font-bold text-text-secondary uppercase tracking-widest mb-4">Patrimônio Consolidado</p>
                  <div className="flex items-baseline gap-3">
                    <p className="font-display font-bold text-[48px] md:text-[72px] text-text-primary tabular-nums tracking-tighter leading-none">
                      {isGhostMode ? "•••••" : formatMoney(data.hero.totalEquity)}
                    </p>
                    <div className="hidden md:block">
                       <span className={`text-[18px] font-bold tabular-nums ${data.hero.totalProfitLossPct >= 0 ? "text-state-success" : "text-state-error"}`}>
                         {data.hero.totalProfitLossPct >= 0 ? "+" : ""}{formatPct(data.hero.totalProfitLossPct)}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:border-l md:border-border-default md:pl-12">
                   <div>
                      <p className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-1">Investido</p>
                      <p className="font-display font-bold text-[22px] md:text-[24px] text-text-primary tabular-nums">
                        {isGhostMode ? "•••••" : formatMoney(data.hero.totalInvested)}
                      </p>
                   </div>
                   <div>
                      <p className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-1">Resultado</p>
                      <p className={`font-display font-bold text-[22px] md:text-[24px] tabular-nums ${data.hero.totalProfitLoss >= 0 ? "text-state-success" : "text-state-error"}`}>
                        {isGhostMode ? "•••••" : formatMoney(data.hero.totalProfitLoss)}
                      </p>
                   </div>
                </div>
              </div>

              {/* Grade de Inteligência (Cardlessish) */}
               <div className="grid gap-8 md:grid-cols-2">
                <div className="p-8 bg-bg-surface border-l-4 border-state-error rounded-xl hover:bg-white transition-colors shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-state-error animate-pulse" />
                    <p className="text-[13px] font-bold text-state-error uppercase tracking-widest">Ponto de Atenção</p>
                  </div>
                  <h3 className="font-display font-bold text-[24px] text-text-primary leading-tight mb-4 tracking-tight">{data.primaryProblem.title}</h3>
                  <p className="text-[16px] text-text-secondary leading-relaxed">{data.primaryProblem.body}</p>
                </div>

                <div className="p-8 bg-brand-primary/[0.03] border-l-4 border-brand-primary rounded-xl hover:bg-brand-primary/[0.05] transition-colors shadow-sm group">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    <p className="text-[13px] font-bold text-brand-primary uppercase tracking-widest">Nossa Sugestão</p>
                  </div>
                  <h3 className="font-display font-bold text-[24px] text-text-primary leading-tight mb-4 tracking-tight">{data.primaryAction.title}</h3>
                  <p className="text-[16px] text-text-secondary leading-relaxed mb-8">{data.primaryAction.body}</p>
                  <Button asChild className="h-12 px-8 bg-brand-primary hover:bg-[#D95C24] text-white font-bold shadow-lg shadow-brand-primary/20 transition-transform active:scale-95">
                    <Link to={normalizeAppTarget(data.primaryAction.target)}>
                      {data.primaryAction.ctaLabel}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Agente IA (Chat Style) */}
              {data.aiSuggestion?.status === "ready" && data.aiSuggestion.text ? (
                 <div className="relative p-10 bg-white border border-border-default/50 rounded-2xl overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
                   </div>
                   <p className="text-[13px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4">Pensamento do Esquilo IA</p>
                   <p className="text-[18px] text-text-primary whitespace-pre-wrap leading-relaxed font-medium italic">"{data.aiSuggestion.text}"</p>
                   <div className="mt-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-[10px]">IA</div>
                        <span className="text-[12px] font-bold text-text-secondary">Análise personalizada</span>
                      </div>
                      <span className="text-[11px] text-text-disabled font-bold uppercase">Gerado hoje</span>
                   </div>
                 </div>
              ) : null}

              {/* Saúde da Carteira (The Seal) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 pt-12 border-t border-border-default/50">
                <div className="flex items-start gap-8">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border-default" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * data.score.value) / 100}
                        className="text-brand-primary transition-all duration-1000 ease-out" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="font-display font-bold text-[32px] text-text-primary leading-none">{data.score.value}</span>
                      <span className="text-[11px] font-bold text-brand-primary uppercase">Score</span>
                    </div>
                  </div>
                  <div className="max-w-md">
                    <h4 className="text-[14px] font-bold text-text-secondary uppercase tracking-widest mb-2">Saúde Geral: <span className="text-brand-primary">{data.score.status}</span></h4>
                    <p className="text-[16px] text-text-secondary leading-relaxed">{data.score.explanation}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="font-bold text-text-primary border-border-default bg-white hover:bg-bg-secondary h-14 px-8 shadow-sm transition-all"
                  onClick={() => setShowDetails((v) => !v)}
                >
                  {showDetails ? "Recolher Listagens" : "Ver Detalhes da Carteira"}
                </Button>
              </div>

              {/* Listagens (Cardless Tables) */}
              {showDetails && (
                <div className="grid gap-20 md:grid-cols-2 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div>
                    <h3 className="font-display font-bold text-[28px] text-text-primary mb-8 tracking-tight">Onde seu dinheiro está:</h3>
                    <ul className="flex flex-col gap-1">
                      {data.distribution.map((d) => (
                        <li key={d.key} className="py-5 flex items-center justify-between hover:bg-bg-secondary/50 px-2 rounded-lg transition-colors border-b border-border-default/30">
                          <div className="flex items-center gap-4">
                            <BankLogo id={d.key} className="w-10 h-10 shadow-sm" />
                            <div>
                              <p className="font-bold text-[16px] text-text-primary">{d.label}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-24 h-1 bg-border-default rounded-full overflow-hidden">
                                   <div className="h-full bg-brand-primary" style={{ width: `${d.sharePct}%` }} />
                                 </div>
                                 <span className="text-[12px] font-bold text-text-secondary">{d.sharePct.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          <p className="font-display font-bold text-[18px] text-text-primary tabular-nums">{isGhostMode ? "•••••" : formatMoney(d.value)}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-8">
                      <Button asChild variant="ghost" className="px-0 text-[15px] text-brand-primary font-bold hover:bg-transparent hover:text-[#D95C24] group">
                        <Link to="/app/portfolio">Ver lista completa de ativos <span className="ml-1 group-hover:ml-2 transition-all">&rarr;</span></Link>
                      </Button>
                    </div>
                  </div>

                  <div>
                     <h3 className="font-display font-bold text-[28px] text-text-primary mb-8 tracking-tight">Destaques & Sinais:</h3>
                     {data.insights.length === 0 ? (
                        <div className="py-12 px-6 border-2 border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center text-center">
                           <p className="text-[15px] font-bold text-text-secondary">Tudo em ordem por aqui.</p>
                           <p className="text-[13px] text-text-disabled mt-1">Nenhum sinal crítico detectado nos papéis secundários.</p>
                        </div>
                     ) : (
                        <ul className="flex flex-col gap-8">
                          {data.insights.map((i, idx) => (
                            <li key={`${i.kind}-${idx}`} className="relative pl-8">
                              <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-brand-primary bg-white" />
                              <p className="font-bold text-[17px] text-text-primary mb-2 leading-tight">{i.title}</p>
                              <p className="text-[15px] text-text-secondary leading-relaxed">{i.body}</p>
                            </li>
                          ))}
                        </ul>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>
      </div>

      {/* Bottom Bar para Mobile */}
      <BottomNav />
    </div>
    </PullToRefresh>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}

function formatMoney(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
}

function formatPct(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(v / 100);
}
