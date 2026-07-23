import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import type { AnalysisData } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";
import { BottomNav } from "@/components/system/BottomNav";
import { useGhostMode } from "@/core/contexts/GhostModeContext";

export function RadarPage() {
  const { isGhostMode } = useGhostMode();
  const ds = useDataSources();
  const [data, setData] = React.useState<AnalysisData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showPlan, setShowPlan] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await ds.analysis.getAnalysis();
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        setData(res.data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Vixe, o Radar perdeu o sinal. Tenta de novo?");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds]);

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col animate-fluid-in">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:py-16 pb-32">
        <header className="mb-12 border-b border-border-default/50 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Visão Tática</p>
              <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none">Radar do Esquilo</h1>
            </div>
            <Button asChild variant="secondary" className="h-12 px-6 font-bold text-[14px] bg-white border border-border-default shadow-sm hover:bg-bg-secondary">
              <Link to="/app/portfolio">Ver Toda a Grade</Link>
            </Button>
          </div>
        </header>

        {error ? (
          <div className="mt-10">
            <ErrorState
              title="Vixe, o Radar saiu do ar"
              body={error}
              ctaLabel="Tentar de novo"
              ctaTarget="/app/radar"
            />
          </div>
        ) : null}

        {!data && !error ? (
          <div className="mt-10">
            <LoadingState title="Ajustando as antenas..." body="O Esquilo está farejando as melhores oportunidades para você." />
          </div>
        ) : data && data.screenState === "redirect_onboarding" ? (
          <div className="mt-10">
            <BlockedState
              title="Opa, Radar trancado!"
              body="A gente precisa entender seu perfil para liberar as recomendações certas para você."
              ctaLabel="Continuar agora"
              ctaTarget={normalizeAppTarget(data.redirectTo)}
              secondaryCtaLabel="Ir para o Perfil"
              secondaryCtaTarget="/app/profile"
            />
          </div>
        ) : data && data.screenState === "pending" ? (
          <div className="mt-10">
            <LoadingState title="A IA está fritando os neurônios..." body={data.pendingState.body} />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-16">
            
            {/* Score & Resumo (Seal Style) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 py-12 border-y border-border-default/50">
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
                    <span className="font-display font-bold text-[32px] text-text-primary leading-none">{isGhostMode ? "••" : data.score.value}</span>
                    <span className="text-[11px] font-bold text-brand-primary uppercase">Score</span>
                  </div>
                </div>
                <div className="max-w-md">
                   <h4 className="text-[14px] font-bold text-text-secondary uppercase tracking-widest mb-2 font-display">Status do Analista: <span className="text-brand-primary">{data.score.status}</span></h4>
                   <p className="text-[17px] text-text-secondary leading-relaxed font-medium italic">"{data.score.explanation}"</p>
                </div>
              </div>
            </div>

            {/* Problem & Action (Cardlessish) */}
            <div className="grid gap-10 md:grid-cols-2">
              <div className="p-10 border-l-8 border-state-error bg-state-error/[0.03] rounded-r-2xl shadow-sm">
                <p className="text-[13px] font-bold text-state-error uppercase tracking-[0.2em] mb-4">Gatilho de Atenção</p>
                <h3 className="font-display font-bold text-[28px] text-text-primary leading-tight mb-4 tracking-tight">{data.primaryProblem.title}</h3>
                <p className="text-[16px] text-text-secondary leading-relaxed">{data.primaryProblem.body}</p>
              </div>

              <div className="p-10 border-l-8 border-brand-primary bg-brand-primary/[0.03] rounded-r-2xl shadow-sm">
                <p className="text-[13px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">Veredito da Célula</p>
                <h3 className="font-display font-bold text-[28px] text-text-primary leading-tight mb-4 tracking-tight">{data.primaryAction.title}</h3>
                <p className="text-[16px] text-text-secondary leading-relaxed mb-8">{data.primaryAction.body}</p>
                <Button asChild className="h-14 px-10 bg-brand-primary hover:bg-[#D95C24] text-white font-bold shadow-lg shadow-brand-primary/20">
                  <Link to={normalizeAppTarget(data.primaryAction.target)}>
                    {data.primaryAction.ctaLabel}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Insights List */}
            <section>
              <h3 className="font-display font-bold text-[32px] text-text-primary mb-10 tracking-tight">Destaques da Tese</h3>
              {data.insights.length ? (
                <div className="grid gap-6">
                  {[...data.insights]
                    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                    .slice(0, 8)
                    .map((i, idx) => (
                      <div
                        key={`${i.kind}-${idx}`}
                        className="group p-8 bg-white border border-border-default/30 rounded-2xl hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             <div className={`w-2 h-2 rounded-full ${i.severity === 'critical' ? 'bg-state-error' : i.severity === 'warning' ? 'bg-[#F2B544]' : 'bg-brand-primary'}`} />
                             <span className="text-[11px] font-bold text-text-disabled uppercase tracking-widest">{i.severity ? severityLabel(i.severity) : "INFO"}</span>
                          </div>
                          <p className="font-bold text-[18px] text-text-primary leading-tight">{i.title}</p>
                          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">{i.body}</p>
                        </div>
                        <div className="flex gap-3">
                          <Button asChild variant="secondary" className="h-10 px-6 font-bold text-[13px] bg-bg-secondary hover:bg-border-default">
                            <Link to={`/app/alerts/${encodeURIComponent(buildAlertId(data.analysisId, idx))}`}>Dossiê</Link>
                          </Button>
                          {i.ctaLabel && i.target ? (
                            <Button asChild className="h-10 px-6 font-bold text-[13px] bg-brand-primary text-white">
                              <Link to={normalizeAppTarget(i.target)}>{i.ctaLabel}</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-border-default rounded-3xl opacity-60">
                  <p className="text-[18px] font-display font-bold text-text-secondary italic">Ué, o Radar ainda não pegou nenhum sinal por aqui.</p>
                </div>
              )}
            </section>

            {/* Ação / Plano Final */}
            <div className="pt-12 border-t border-border-default/50">
               <button 
                 onClick={() => setShowPlan((v) => !v)}
                 className="flex items-center gap-2 text-brand-primary font-bold hover:underline mb-8"
               >
                 {showPlan ? "↓ Recolher Plano Estratégico" : "↑ Expandir Plano Estratégico Completo"}
               </button>

              {showPlan ? (
                <div className="bg-white p-10 rounded-2xl border border-border-default/50 shadow-sm animate-in zoom-in-95 duration-200">
                  <h3 className="font-display font-bold text-[28px] text-text-primary mb-6">Plano de Evolução</h3>
                  <p className="text-[17px] text-text-secondary leading-relaxed mb-10 border-b border-border-default/30 pb-10 italic">
                    "{data.portfolioDecision}"
                  </p>
                  <ul className="grid gap-6 md:grid-cols-2">
                    {data.actionPlan.map((x, idx) => (
                      <li
                        key={idx}
                        className="p-6 bg-bg-secondary/40 rounded-xl border border-border-default/20 flex gap-4"
                      >
                        <span className="font-display font-bold text-brand-primary text-[18px]">{idx + 1}.</span>
                        <p className="text-[15px] font-bold text-text-primary leading-snug">{x}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}

function buildAlertId(analysisId: string, index: number) {
  return `${analysisId}:${index}`;
}

function severityLabel(sev: "info" | "warning" | "critical") {
  if (sev === "critical") return "Crítico";
  if (sev === "warning") return "Atenção";
  return "Info";
}
