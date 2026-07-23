import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { AnalysisData } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function AlertDetailPage() {
  const { alertId } = useParams();
  const ds = useDataSources();
  const [data, setData] = React.useState<AnalysisData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const parsed = React.useMemo(() => parseAlertId(alertId ?? null), [alertId]);

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

  const item =
    data && data.screenState === "ready" && parsed
      ? data.insights[parsed.index] ?? null
      : null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="ty-caption text-text-secondary">Alertas</p>
          <h1 className="ty-h1 font-display">Detalhe do alerta</h1>
        </div>
        <Button asChild variant="secondary">
          <Link to="/app/alerts">Voltar</Link>
        </Button>
      </header>

      {error ? (
        <ErrorState
          title="Não consegui abrir este alerta"
          body={error}
          ctaLabel="Voltar para alertas"
          ctaTarget="/app/alerts"
        />
      ) : null}

      {!data && !error ? (
        <LoadingState title="Carregando alerta" body="Só um instante." />
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
      ) : data && data.screenState === "ready" && !parsed ? (
        <ErrorState
          title="Ih, esse alerta sumiu"
          body="Este alerta não existe ou expirou."
          ctaLabel="Voltar para alertas"
          ctaTarget="/app/alerts"
        />
      ) : data && data.screenState === "ready" && !item ? (
        <ErrorState
          title="Alerta não encontrado"
          body="Este alerta não existe mais. Abra a lista para ver os alertas atuais."
          ctaLabel="Voltar para alertas"
          ctaTarget="/app/alerts"
        />
      ) : item ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="ty-body text-text-secondary">{item.body}</p>
              <div className="rounded-md border border-border-default bg-bg-surface p-3">
                <p className="ty-caption text-text-secondary">Por que isso existe</p>
                <p className="ty-body">
                  {whyThisExists(item.kind, item.severity)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.ctaLabel && item.target ? (
                  <Button asChild>
                    <Link to={normalizeAppTarget(item.target)}>{item.ctaLabel}</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/app/radar">Abrir Radar</Link>
                  </Button>
                )}
                <Button asChild variant="secondary">
                  <Link to="/app/portfolio">Ver carteira</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}

function parseAlertId(value: string | null): { analysisId: string; index: number } | null {
  if (!value) return null;
  const [analysisId, idxRaw] = value.split(":");
  const idx = Number(idxRaw);
  if (!analysisId || !Number.isFinite(idx) || idx < 0) return null;
  return { analysisId, index: idx };
}

function whyThisExists(kind: string, sev?: "info" | "warning" | "critical") {
  const k = (kind || "").toLowerCase();
  if (k.includes("concentration") || k.includes("concentracao")) {
    return "Você pode estar mais concentrado do que o ideal em um bloco da carteira, o que aumenta risco.";
  }
  if (k.includes("import")) {
    return "Existe uma importação que merece revisão ou rastreio para garantir consistência dos dados.";
  }
  if (k.includes("context") || k.includes("onboarding")) {
    return "Falta contexto para o produto orientar com precisão.";
  }
  if (sev === "critical") return "Este ponto tem impacto alto e merece prioridade.";
  if (sev === "warning") return "Este ponto pode melhorar a saúde da carteira com um próximo passo simples.";
  return "Este é um sinal leve que ajuda a entender sua carteira com mais clareza.";
}

