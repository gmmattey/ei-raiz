import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { AnalysisData } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function AlertsPage() {
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
        setError(e instanceof Error ? e.message : "Falha ao carregar.");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds]);

  return (
    <div className="space-y-4">
      <header>
        <p className="ty-caption text-text-secondary">Alertas</p>
        <h1 className="ty-h1 font-display">Seus alertas</h1>
        <p className="ty-body text-text-secondary">O que pede atenção agora, com ação sugerida.</p>
      </header>

      {error ? (
        <ErrorState
          title="Não consegui abrir seus alertas"
          body={error}
          ctaLabel="Tentar de novo"
          ctaTarget="/app/alerts"
          secondaryCtaLabel="Abrir Radar"
          secondaryCtaTarget="/app/radar"
        />
      ) : null}

      {!data && !error ? (
        <LoadingState title="Carregando alertas" body="Só um instante." />
      ) : data && data.screenState === "redirect_onboarding" ? (
        <BlockedState
          title="Falta um passo para destravar"
          body="Complete seu onboarding para gerar alertas coerentes."
          ctaLabel="Continuar onboarding"
          ctaTarget={normalizeAppTarget(data.redirectTo)}
          secondaryCtaLabel="Ir para o Perfil"
          secondaryCtaTarget="/app/profile"
        />
      ) : data && data.screenState === "pending" ? (
        <LoadingState title="Gerando sua análise" body={data.pendingState.body} />
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista</CardTitle>
          </CardHeader>
          <CardContent>
            {data.insights.length ? (
              <ul className="space-y-2">
                {[...data.insights]
                  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                  .slice(0, 20)
                  .map((i, idx) => {
                    const id = buildAlertId(data.analysisId, idx);
                    return (
                      <li
                        key={`${i.kind}-${idx}`}
                        className="rounded-md border border-border-default bg-bg-primary p-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="ty-body">{i.title}</p>
                          <p className="ty-caption text-text-secondary">
                            {severityLabel(i.severity)}
                          </p>
                        </div>
                        <p className="ty-caption text-text-secondary">{i.body}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link to={`/app/alerts/${encodeURIComponent(id)}`}>
                              Ver detalhe
                            </Link>
                          </Button>
                          {i.ctaLabel && i.target ? (
                            <Button asChild size="sm">
                              <Link to={normalizeAppTarget(i.target)}>{i.ctaLabel}</Link>
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="rounded-md border border-border-default bg-bg-surface p-3">
                <p className="ty-caption text-text-secondary">Sem alertas</p>
                <p className="ty-body text-text-secondary">
                  Nada crítico no momento. Use o Radar para a leitura executiva.
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/app/radar">Abrir Radar</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
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

function severityLabel(sev?: "info" | "warning" | "critical") {
  if (sev === "critical") return "crítico";
  if (sev === "warning") return "atenção";
  return "info";
}
