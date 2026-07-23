import * as React from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useDataSources } from "@/core/data/react";
import { BottomNav } from "@/components/system/BottomNav";
import type { HistoryTimelineData } from "@/core/data/contracts";
import { useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/SystemState";

export function HistoryPage() {
  const ds = useDataSources();
  const [sp] = useSearchParams();
  const [data, setData] = React.useState<HistoryTimelineData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await ds.history.getHistoryTimeline({ limit: 50 });
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        setData(res.data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Vixe, perdemos a linha do tempo. Tenta abrir de novo!");
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
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Histórico & Logs</p>
              <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none">Sua Linha do Tempo</h1>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary" className="h-12 px-6 font-bold text-[14px] bg-white border border-border-default shadow-sm hover:bg-bg-secondary">
                <Link to="/app/history/imports">Central de Importação</Link>
              </Button>
            </div>
          </div>
        </header>

        {sp.get("snapshotId") ? (
          <div className="mb-10 p-6 bg-brand-primary/5 border-l-4 border-brand-primary rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[12px] font-bold text-brand-primary uppercase tracking-widest mb-1">Cofre Atualizado</p>
            <p className="text-[16px] text-text-primary font-medium">
              Snapshot criado com sucesso 
              {sp.get("affected") ? ` • ${sp.get("affected")} ativos foram mexidos` : ""}.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-10">
            <ErrorState
              title="A linha do tempo deu um nó"
              body={error}
              ctaLabel="Tentar de novo"
              ctaTarget="/app/history"
            />
          </div>
        ) : null}

        {!data && !error ? (
          <div className="mt-10">
            <LoadingState title="Buscando suas memórias..." body="Estamos montando sua linha do tempo financeira completa." />
          </div>
        ) : data && data.screenState === "redirect_onboarding" ? (
          <div className="mt-10 p-12 text-center border-2 border-dashed border-border-default rounded-3xl bg-white shadow-sm">
             <h2 className="font-display font-bold text-[28px] text-text-primary">Histórico Trancado</h2>
             <p className="text-[16px] text-text-secondary mt-3 max-w-sm mx-auto">Complete seu perfil para que a gente consiga salvar e mostrar sua evolução patrimonial.</p>
             <Button asChild className="mt-8 bg-brand-primary h-14 px-10 font-bold text-white shadow-lg shadow-brand-primary/20">
                <Link to={normalizeAppTarget(data.redirectTo)}>Destravar Agora</Link>
             </Button>
          </div>
        ) : data && data.screenState === "empty" ? (
          <div className="mt-10">
            <EmptyState
              title="Nenhuma pegada ainda"
              body="Sua história no Esquilo Invest começa assim que você trouxer sua primeira carteira."
              ctaLabel="Importar Agora"
              ctaTarget={normalizeAppTarget(data.emptyState.target)}
            />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-1">
            {data.items.map((it) =>
              it.kind === "snapshot" ? (
                <div
                  key={it.id}
                  className="group py-8 px-6 hover:bg-white hover:shadow-xl transition-all rounded-2xl border-b border-border-default/30 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1.5 w-3 h-3 rounded-full bg-brand-primary" />
                    <div>
                      <p className="font-bold text-[18px] text-text-primary">
                        Atualização do Cofre • {formatDate(it.referenceDate)}
                      </p>
                      {it.recommendation ? (
                        <p className="text-[14px] text-text-secondary mt-2 font-medium">
                          {it.recommendation.primaryProblem} <span className="opacity-30 mx-2">|</span> {it.recommendation.primaryAction}
                          {it.recommendation.scoreValue != null ? <> <span className="opacity-30 mx-2">|</span> <span className="text-brand-primary">Score {it.recommendation.scoreValue}</span></> : ""}
                        </p>
                      ) : (
                        <p className="text-[14px] text-text-secondary mt-2 italic opacity-60">Snapshot gerado sem recomendações automáticas.</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right pl-7 md:pl-0">
                    <p className="font-display font-bold text-[24px] text-text-primary tabular-nums tracking-tighter">
                      {formatMoney(it.totals.totalEquity)}
                    </p>
                    <p className="text-[11px] font-bold text-text-disabled uppercase mt-1">Total Consolidado</p>
                  </div>
                </div>
              ) : (
                <div
                  key={it.id}
                  className="py-6 px-6 border-b border-border-default/20 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full border-2 border-text-secondary" />
                    <div>
                    <p className="text-[15px] font-bold text-text-primary">
                      {it.type}
                    </p>
                    {it.message ? (
                      <p className="text-[13px] text-text-secondary mt-1">{it.message}</p>
                    ) : null}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-text-disabled uppercase px-2 py-0.5 bg-bg-secondary rounded font-mono">{it.status}</span>
                </div>
              ),
            )}
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

function formatMoney(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
}
