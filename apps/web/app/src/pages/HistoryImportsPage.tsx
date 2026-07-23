import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { HistoryImportsData } from "@/core/data/contracts";
import { BlockedState, EmptyState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function HistoryImportsPage() {
  const ds = useDataSources();
  const [data, setData] = React.useState<HistoryImportsData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await ds.history.getHistoryImports({ limit: 50 });
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="ty-caption text-text-secondary">Histórico</p>
          <h1 className="ty-h1 font-display">Importações</h1>
          <p className="ty-body text-text-secondary">
            Rastreie o que entrou, de onde veio e qual foi o resultado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/app/history">Linha do tempo</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/app/import">Nova importação</Link>
          </Button>
        </div>
      </header>

      {error ? (
        <ErrorState
          title="Não consegui abrir suas importações"
          body={error}
          ctaLabel="Tentar de novo"
          ctaTarget="/app/history/imports"
          secondaryCtaLabel="Voltar para o Histórico"
          secondaryCtaTarget="/app/history"
        />
      ) : null}

      {!data && !error ? (
        <LoadingState title="Carregando importações" body="Só um instante." />
      ) : data && data.screenState === "redirect_onboarding" ? (
        <BlockedState
          title="Falta um passo para destravar"
          body="Complete seu onboarding para rastrear suas importações."
          ctaLabel="Continuar onboarding"
          ctaTarget={normalizeAppTarget(data.redirectTo)}
          secondaryCtaLabel="Ir para o Perfil"
          secondaryCtaTarget="/app/profile"
        />
      ) : data && data.screenState === "empty" ? (
        <EmptyState
          title={data.emptyState.title}
          body={data.emptyState.body}
          ctaLabel={data.emptyState.ctaLabel}
          ctaTarget={normalizeAppTarget(data.emptyState.target)}
        />
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ty-number-hi">{data.summary.totalImports}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ty-number-hi">{data.summary.pendingImports}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ty-number-hi">{data.summary.completedImports}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Falhas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ty-number-hi">{data.summary.failedImports}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.imports.map((imp) => (
                  <li
                    key={imp.id}
                    className="rounded-md border border-border-default bg-bg-primary p-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="ty-body">
                        {imp.originLabel} • {imp.statusLabel}
                      </p>
                      <p className="ty-caption text-text-secondary">
                        {formatDateTime(imp.updatedAt)}
                      </p>
                    </div>
                    <p className="ty-caption text-text-secondary">
                      {imp.fileName ? imp.fileName : "Sem arquivo"} • {imp.totals.validRows} válidas •{" "}
                      {imp.totals.invalidRows} inválidas • {imp.totals.duplicateRows} duplicadas
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link to={normalizeAppTarget(imp.primaryAction.target)}>
                          {imp.primaryAction.title}
                        </Link>
                      </Button>
                      {imp.secondaryAction ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link to={normalizeAppTarget(imp.secondaryAction.target)}>
                            {imp.secondaryAction.title}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
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

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

