import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { ImportEngineStatusData } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function ImportOpsPage() {
  const { importId } = useParams();
  const ds = useDataSources();
  const [data, setData] = React.useState<ImportEngineStatusData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!importId) return;
      try {
        const res = await ds.imports.getEngineStatus({ importId });
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
  }, [ds, importId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="ty-caption text-text-secondary">Importação</p>
          <h1 className="ty-h1 font-display">Status operacional</h1>
          <p className="ty-body text-text-secondary">
            Rastreamento do processamento, sem misturar com regra de negócio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/preview` : "/app/import"}>
              Voltar ao preview
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/detail` : "/app/import"}>
              Ver detalhe
            </Link>
          </Button>
        </div>
      </header>

      {error ? (
        <ErrorState
          title="Não consegui abrir o status"
          body={error}
          ctaLabel="Tentar de novo"
          ctaTarget={importId ? `/app/import/${encodeURIComponent(importId)}/ops` : "/app/import"}
          secondaryCtaLabel="Voltar"
          secondaryCtaTarget="/app/import"
        />
      ) : null}

      {!data && !error ? (
        <LoadingState title="Carregando status" body="Só um instante." />
      ) : data && data.screenState === "redirect_onboarding" ? (
        <BlockedState
          title="Falta um passo para destravar"
          body="Complete seu onboarding para acompanhar o processamento da importação."
          ctaLabel="Continuar onboarding"
          ctaTarget={normalizeAppTarget(data.redirectTo)}
          secondaryCtaLabel="Ir para o Perfil"
          secondaryCtaTarget="/app/profile"
        />
      ) : data && data.screenState === "ready" ? (
        <>
          {/**
           * A partir daqui, `data` e' do tipo ready (narrowing por screenState).
           */}
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="ty-body">
                {data.engineStatus.label} ({data.engineStatus.status})
              </p>
              <p className="ty-caption text-text-secondary">
                Origem: {data.origin} • Status: {data.importStatus}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-border-default bg-bg-surface p-3">
                  <p className="ty-caption text-text-secondary">Documento</p>
                  <p className="ty-body">
                    {data.document.parserMode} • conf {Math.round(data.document.confidence * 100)}%
                  </p>
                </div>
                <div className="rounded-md border border-border-default bg-bg-surface p-3">
                  <p className="ty-caption text-text-secondary">Pronto para</p>
                  <p className="ty-body">
                    {data.engineStatus.readyForReview ? "revisão" : "processamento"}{" "}
                    {data.engineStatus.readyToCommit ? "• commit" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Linhas" value={String(data.summary.totalRows)} />
                <Metric label="Válidas" value={String(data.summary.validRows)} />
                <Metric label="Inválidas" value={String(data.summary.invalidRows)} />
                <Metric label="Duplicadas" value={String(data.summary.duplicateRows)} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Metric label="Baixa confiança" value={String(data.summary.lowConfidenceRows)} />
                <Metric label="Fallback" value={String(data.summary.fallbackRows)} />
                <Metric label="Bloqueadas" value={String(data.summary.blockedRows)} />
                <Metric label="Falhas" value={String(data.summary.failedRows)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/detail` : "/app/import"}>
                    Ver detalhe operacional
                  </Link>
                </Button>
                {data.targets.conflicts ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/conflicts` : "/app/import"}>
                      Resolver duplicidades
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="secondary">
                  <Link to="/app/history/imports">Ir para histórico de importações</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-3">
      <p className="ty-caption text-text-secondary">{label}</p>
      <p className="ty-h3 font-display">{value}</p>
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}
