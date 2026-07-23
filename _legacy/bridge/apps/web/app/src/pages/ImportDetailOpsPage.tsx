import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { ImportDetailData, ImportDetailRow } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function ImportDetailOpsPage() {
  const { importId } = useParams();
  const ds = useDataSources();
  const [data, setData] = React.useState<ImportDetailData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"issues" | "decisions" | "all">("issues");

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!importId) return;
      try {
        const res = await ds.imports.getImportDetail({ importId });
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

  const rows: ImportDetailRow[] = data && data.screenState === "ready" ? data.rows ?? [] : [];

  const visible = rows.filter((r) => {
    if (mode === "all") return true;
    if (mode === "issues") {
      return (
        r.operationalFlags.hasError ||
        r.operationalFlags.hasConflict ||
        r.operationalFlags.hasLowConfidence ||
        r.operationalFlags.nonImportable
      );
    }
    return r.decision.code !== "none";
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="ty-caption text-text-secondary">Importação</p>
          <h1 className="ty-h1 font-display">Detalhe operacional</h1>
          <p className="ty-body text-text-secondary">
            Erros, conflitos, baixa confiança e decisões por linha.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/preview` : "/app/import"}>
              Preview
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/ops` : "/app/import"}>
              Status
            </Link>
          </Button>
        </div>
      </header>

      {error ? (
        <ErrorState
          title="Não consegui abrir o detalhe"
          body={error}
          ctaLabel="Tentar de novo"
          ctaTarget={importId ? `/app/import/${encodeURIComponent(importId)}/detail` : "/app/import"}
          secondaryCtaLabel="Voltar"
          secondaryCtaTarget="/app/import"
        />
      ) : null}

      {!data && !error ? (
        <LoadingState title="Carregando detalhe" body="Só um instante." />
      ) : data && data.screenState === "redirect_onboarding" ? (
        <BlockedState
          title="Falta um passo para destravar"
          body="Complete seu onboarding para revisar o detalhe operacional."
          ctaLabel="Continuar onboarding"
          ctaTarget={normalizeAppTarget(data.redirectTo)}
          secondaryCtaLabel="Ir para o Perfil"
          secondaryCtaTarget="/app/profile"
        />
      ) : data && data.screenState === "ready" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={mode === "issues" ? "default" : "secondary"}
                onClick={() => setMode("issues")}
              >
                Pendências
              </Button>
              <Button
                size="sm"
                variant={mode === "decisions" ? "default" : "secondary"}
                onClick={() => setMode("decisions")}
              >
                Decisões
              </Button>
              <Button
                size="sm"
                variant={mode === "all" ? "default" : "secondary"}
                onClick={() => setMode("all")}
              >
                Todas
              </Button>
              <span className="ty-caption text-text-secondary self-center">
                {visible.length} de {rows.length} linhas
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linhas</CardTitle>
            </CardHeader>
            <CardContent>
              {visible.length ? (
                <ul className="space-y-2">
                  {visible.slice(0, 50).map((r) => (
                    <li key={r.rowId} className="rounded-md border border-border-default bg-bg-primary p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="ty-body">Linha {r.rowNumber}</p>
                        <p className="ty-caption text-text-secondary">{r.resolutionStatus}</p>
                      </div>
                      {r.errorMessage ? (
                        <p className="ty-caption text-state-error">{r.errorMessage}</p>
                      ) : null}
                      {r.lowConfidenceFields.length ? (
                        <p className="ty-caption text-text-secondary">
                          Baixa confiança:{" "}
                          {r.lowConfidenceFields
                            .slice(0, 3)
                            .map((f) => `${f.field} (${Math.round(f.confidence * 100)}%)`)
                            .join(", ")}
                        </p>
                      ) : null}
                      {r.operationalFlags.hasConflict ? (
                        <p className="ty-caption text-text-secondary">Possível conflito/duplicidade.</p>
                      ) : null}
                      {r.decision.code !== "none" ? (
                        <div className="mt-2 rounded-md border border-border-default bg-bg-surface p-3">
                          <p className="ty-caption text-text-secondary">Decisão</p>
                          <p className="ty-body">
                            {r.decision.label} ({r.decision.origin})
                          </p>
                          <p className="ty-caption text-text-secondary">{r.decision.details}</p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ty-body text-text-secondary">
                  Nada para mostrar com este filtro.
                </p>
              )}
              {visible.length > 50 ? (
                <p className="mt-3 ty-caption text-text-secondary">
                  Mostrando 50 itens para manter a tela rápida.
                </p>
              ) : null}
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

