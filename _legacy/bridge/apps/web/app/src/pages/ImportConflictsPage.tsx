import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataSources } from "@/core/data/react";
import type { ImportConflictsData, ImportDuplicateAction } from "@/core/data/contracts";
import { BlockedState, EmptyState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function ImportConflictsPage() {
  const { importId } = useParams();
  const ds = useDataSources();
  const [data, setData] = React.useState<ImportConflictsData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [resolving, setResolving] = React.useState<string | null>(null);

  const fetchConflicts = React.useCallback(async () => {
    if (!importId) return;
    setError(null);
    try {
      const res = await ds.imports.getConflicts({ importId });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    }
  }, [ds, importId]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (cancelled) return;
      await fetchConflicts();
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchConflicts]);

  async function onResolve(rowId: string, action: ImportDuplicateAction) {
    if (!importId) return;
    setResolving(rowId);
    setError(null);
    try {
      const res = await ds.imports.resolveDuplicateRow({ importId, rowId, payload: { action } });
      if (!res.ok) {
        setError(res.error.message || "Não consegui salvar sua decisão.");
        return;
      }
      await fetchConflicts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="ty-caption text-text-secondary">Importação</p>
          <h1 className="ty-h1 font-display">Conflitos e duplicidades</h1>
          <p className="ty-body text-text-secondary">
            Aqui ficam as pendências que impedem o commit. Você decide explicitamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to={importId ? `/app/import/${encodeURIComponent(importId)}/preview` : "/app/import"}>
              Voltar ao preview
            </Link>
          </Button>
        </div>
      </header>

      {error ? (
        <ErrorState
          title="Não consegui abrir os conflitos"
          body={error}
          ctaLabel="Tentar de novo"
          ctaTarget={importId ? `/app/import/${encodeURIComponent(importId)}/conflicts` : "/app/import"}
          secondaryCtaLabel="Voltar"
          secondaryCtaTarget="/app/import"
        />
      ) : null}

      {!data && !error ? (
        <LoadingState title="Carregando conflitos" body="Só um instante." />
      ) : data && (data as any).screenState === "redirect_onboarding" ? (
        <BlockedState
          title="Falta um passo para destravar"
          body="Complete seu onboarding para revisar conflitos de duplicidade."
          ctaLabel="Continuar onboarding"
          ctaTarget={normalizeAppTarget((data as any).redirectTo)}
          secondaryCtaLabel="Ir para o Perfil"
          secondaryCtaTarget="/app/profile"
        />
      ) : data && (data as any).screenState === "empty" ? (
        <EmptyState
          title={(data as any).emptyState?.title || "Sem conflitos pendentes"}
          body={(data as any).emptyState?.body || "Quando houver duplicidades, elas aparecem aqui."}
          ctaLabel={(data as any).emptyState?.ctaLabel || "Voltar ao preview"}
          ctaTarget={normalizeAppTarget((data as any).emptyState?.target || "/imports/entry")}
        />
      ) : data && (data as any).screenState === "ready" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Total" value={String((data as any).summary?.totalConflicts ?? 0)} />
                <Metric label="Pendentes" value={String((data as any).summary?.unresolvedConflicts ?? 0)} />
                <Metric label="Resolvidos" value={String((data as any).summary?.resolvedConflicts ?? 0)} />
              </div>
              <p className="mt-3 ty-caption text-text-secondary">
                Dica: se você já tem esse ativo na carteira, normalmente faz sentido <strong>consolidar</strong> ou <strong>substituir</strong>.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {Array.isArray((data as any).conflicts) ? (data as any).conflicts.map((c: any) => (
              <Card key={String(c.rowId || c.rowNumber)}>
                <CardHeader>
                  <CardTitle>Linha {c.rowNumber}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-border-default bg-bg-surface p-3">
                      <p className="ty-caption text-text-secondary">Entrada da importação</p>
                      <p className="ty-body font-medium">{String(c.incoming?.name || "—")}</p>
                      <p className="ty-caption text-text-secondary">
                        {String(c.incoming?.sourceKind || "")} {c.incoming?.code ? `• ${String(c.incoming.code)}` : ""}
                      </p>
                      <p className="ty-caption text-text-secondary">
                        Qtd {Number(c.incoming?.quantity || 0)} • Invest {fmtMoney(c.incoming?.investedAmount)} • Atual {fmtMoney(c.incoming?.currentAmount)}
                      </p>
                    </div>
                    <div className="rounded-md border border-border-default bg-bg-surface p-3">
                      <p className="ty-caption text-text-secondary">Candidato(s) na carteira</p>
                      {Array.isArray(c.duplicateCandidates) && c.duplicateCandidates.length ? (
                        <ul className="space-y-2">
                          {c.duplicateCandidates.slice(0, 3).map((d: any, idx: number) => (
                            <li key={String(d.assetId || d.assetName || `candidate_${idx}`)} className="rounded-md bg-bg-primary p-2">
                              <p className="ty-body">{String(d.assetName || "—")}</p>
                              <p className="ty-caption text-text-secondary">
                                {d.assetCode ? `${String(d.assetCode)} • ` : ""}
                                Qtd {Number(d.quantity || 0)} • Invest {fmtMoney(d.investedAmount)} • Atual {fmtMoney(d.currentAmount)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="ty-caption text-text-secondary">Sem candidatos listados.</p>
                      )}
                    </div>
                  </div>

                  {c.errorMessage ? <p className="ty-caption text-state-warning">{String(c.errorMessage)}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(c.allowedActions) ? c.allowedActions.map((a: any) => {
                      const code = String(a.code) as ImportDuplicateAction;
                      const label = String(a.label || a.code);
                      return (
                        <Button
                          key={`${c.rowId}:${code}`}
                          size="sm"
                          variant={code === "consolidate" || code === "replace_existing" ? "default" : "secondary"}
                          disabled={resolving === String(c.rowId)}
                          onClick={() => void onResolve(String(c.rowId), code)}
                        >
                          {resolving === String(c.rowId) ? "Salvando…" : label}
                        </Button>
                      );
                    }) : null}
                  </div>
                </CardContent>
              </Card>
            )) : null}
          </div>
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

function fmtMoney(value: unknown) {
  const raw = typeof value === "number" ? value : Number(value || 0);
  const n = Number.isFinite(raw) ? raw : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}
