import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { AnalysisData } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function ScorePage() {
  const ds = useDataSources();
  const [data, setData] = React.useState<AnalysisData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
        setError(e instanceof Error ? e.message : "Ih, deu um nó ao carregar seu Score. Tenta de novo?");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds]);

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col animate-fluid-in px-6 py-8 md:py-16 pb-32">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-12 border-b border-border-default/50 pb-10">
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Saúde Financeira</p>
          <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none">Análise de Score</h1>
          <p className="text-[17px] text-text-secondary mt-4 max-w-xl leading-relaxed font-medium">Uma leitura profunda do que está pesando a favor ou contra sua nota técnica.</p>
        </header>

        {error ? (
          <div className="mt-10">
            <ErrorState
              title="Ih, seu Score ficou tímido e não apareceu"
              body={error}
              ctaLabel="Tentar de novo"
              ctaTarget="/app/score"
              secondaryCtaLabel="Voltar para o Radar"
              secondaryCtaTarget="/app/radar"
            />
          </div>
        ) : null}

        {!data && !error ? (
          <div className="mt-10">
            <LoadingState title="Calculando sua nota..." body="O Esquilo está conferindo seus papéis." />
          </div>
        ) : data && data.screenState === "redirect_onboarding" ? (
          <div className="mt-10">
            <BlockedState
              title="Opa, falta só um tiquinho para liberar seu Score"
              body="Complete seu onboarding para gerar um score coerente."
              ctaLabel="Continuar onboarding"
              ctaTarget={normalizeAppTarget(data.redirectTo)}
              secondaryCtaLabel="Ir para o Perfil"
              secondaryCtaTarget="/app/profile"
            />
          </div>
        ) : data && data.screenState === "pending" ? (
          <div className="mt-10">
            <LoadingState title="A IA está lendo sua carteira..." body={data.pendingState.body} />
          </div>
        ) : data ? (
          <div className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
            
            {/* Nota & Status */}
            <div>
              <div className="bg-white border border-border-default shadow-sm rounded-3xl p-8 sticky top-24">
                <p className="text-[13px] font-bold text-text-secondary uppercase tracking-widest mb-6">Sua Nota Esquilo</p>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-display font-bold text-[72px] md:text-[96px] text-text-primary leading-none tracking-tighter tabular-nums">
                    {data.score.value}
                  </span>
                  <span className={`text-[18px] font-bold uppercase tracking-widest ${data.score.value >= 70 ? "text-state-success" : "text-brand-primary"}`}>
                    {humanScoreBand(data.score.value)}
                  </span>
                </div>
                <p className="text-[17px] text-text-secondary leading-relaxed font-medium italic border-t border-border-default/50 pt-6 mt-6">
                  "{data.score.explanation}"
                </p>
                
                <div className="mt-10 flex flex-col gap-3">
                  <Button asChild className="h-14 w-full bg-brand-primary hover:bg-[#D95C24] text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20">
                    <Link to="/app/radar">Abrir Visão Tática (Radar)</Link>
                  </Button>
                  <Button asChild variant="ghost" className="h-12 w-full text-text-secondary font-bold">
                    <Link to="/app/portfolio">Explorar Carteira Completa</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Insights / O que Pesa */}
            <div className="space-y-10">
              <section>
                <h3 className="font-display font-bold text-[28px] text-text-primary mb-8 tracking-tight">O que compõe seu Score</h3>
                {data.insights.length ? (
                  <ul className="grid gap-4">
                    {[...data.insights]
                      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                      .slice(0, 10)
                      .map((i, idx) => (
                        <li
                          key={`${i.kind}-${idx}`}
                          className="group bg-white border border-border-default/50 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-bold text-[17px] text-text-primary leading-tight">{i.title}</p>
                            <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-bg-secondary ${i.severity === 'critical' ? 'text-state-error' : i.severity === 'warning' ? 'text-brand-primary' : 'text-text-secondary'}`}>
                              {severityLabel(i.severity)}
                            </span>
                          </div>
                          <p className="text-[15px] text-text-secondary leading-relaxed">{i.body}</p>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border-default rounded-3xl opacity-60">
                    <p className="text-[18px] font-display font-bold text-text-secondary italic">Ainda não temos detalhes suficientes para explicar essa nota.</p>
                  </div>
                )}
              </section>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}

function humanScoreBand(value: number) {
  if (value < 40) return "precisa de atenção";
  if (value < 70) return "ok, mas melhorável";
  return "saudável";
}

function severityLabel(sev?: "info" | "warning" | "critical") {
  if (sev === "critical") return "crítico";
  if (sev === "warning") return "atenção";
  return "info";
}
