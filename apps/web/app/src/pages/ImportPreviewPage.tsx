import * as React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import type { ImportPreviewData, ImportEngineStatusData } from "@/core/data/contracts";
import { ErrorState, LoadingState } from "@/components/system/SystemState";

export function ImportPreviewPage() {
  const { importId } = useParams();
  const ds = useDataSources();
  const nav = useNavigate();
  const [data, setData] = React.useState<ImportPreviewData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [committing, setCommitting] = React.useState(false);
  const [ops, setOps] = React.useState<ImportEngineStatusData | null>(null);
  const [confirmCommit, setConfirmCommit] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!importId) return;
      try {
        const res = await ds.imports.getPreview({ importId });
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        setData(res.data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Vixe, perdemos a folha no meio do caminho. Teria como colocar a planilha de novo?");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds, importId]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!importId) return;
      try {
        const res = await ds.imports.getEngineStatus({ importId });
        if (cancelled) return;
        if (res.ok) setOps(res.data);
      } catch {
        // operacional nao deve quebrar o preview
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds, importId]);

  async function onCommit() {
    if (!importId) return;
    setCommitting(true);
    setError(null);
    try {
      const res = await ds.imports.commitImport({ importId });
      if (!res.ok) {
        setError(
          res.error.message ||
            "Não consegui confirmar a importação. Você pode ajustar e tentar de novo.",
        );
        return;
      }
      const next = normalizeAppTarget(res.data.nextStep);
      const url = new URL(next, window.location.origin);
      url.searchParams.set("importId", res.data.importId);
      url.searchParams.set("snapshotId", res.data.createdSnapshotId);
      url.searchParams.set("affected", String(res.data.affectedPositions));
      nav(`${url.pathname}${url.search}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deu um errinho de gravação por aqui. Dá mais um clique ali pra confirmar!");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 md:py-16 animate-fluid-in">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-default pb-8">
        <div>
          <p className="text-[14px] font-semibold uppercase tracking-wider text-brand-primary mb-1">Passo Final</p>
          <h1 className="font-display font-bold text-[36px] md:text-[44px] text-text-primary tracking-tight leading-none">Revisão</h1>
        </div>
        <div className="flex gap-3">
           <Button asChild variant="secondary" className="h-10 text-[14px] font-semibold">
              <Link to="/app/import">Cancelar</Link>
           </Button>
        </div>
      </header>

      {error ? (
         <div className="mb-8">
          <ErrorState
            title="Não deu para concluir agora"
            body={error ?? ""}
            ctaLabel="Voltar para o import"
            ctaTarget="/app/import"
            secondaryCtaLabel="Ver perfil"
            secondaryCtaTarget="/app/profile"
          />
         </div>
      ) : null}

      {!data && !error ? (
        <LoadingState title="Processando Planilha" body="Validando formatos e cruzando dados..." />
      ) : data ? (
        <div className="flex flex-col gap-10">

          {/* Área de Impacto e Métricas */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="border border-border-default bg-bg-surface p-4 rounded-xl">
                 <p className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Total Avaliado</p>
                 <p className="font-display font-bold tabular-nums text-[32px] md:text-[40px] text-text-primary leading-none">{data.totals.totalRows}</p>
             </div>
             <div className="border border-border-default bg-bg-surface p-4 rounded-xl border-t-4 border-t-state-success shadow-sm">
                 <p className="text-[12px] font-bold text-state-success uppercase tracking-widest mb-1.5">Intactas</p>
                 <p className="font-display font-bold tabular-nums text-[32px] md:text-[40px] text-text-primary leading-none">{data.totals.validRows}</p>
             </div>
             <div className={`border border-border-default bg-bg-surface p-4 rounded-xl shadow-sm ${data.totals.invalidRows > 0 ? "border-t-4 border-t-state-error bg-state-error/5" : "border-t-4 border-t-border-default"}`}>
                 <p className={`text-[12px] font-bold uppercase tracking-widest mb-1.5 ${data.totals.invalidRows > 0 ? "text-state-error" : "text-text-secondary"}`}>Inválidas</p>
                 <p className={`font-display font-bold tabular-nums text-[32px] md:text-[40px] leading-none ${data.totals.invalidRows > 0 ? "text-state-error" : "text-text-primary"}`}>{data.totals.invalidRows}</p>
             </div>
             <div className={`border border-border-default bg-bg-surface p-4 rounded-xl shadow-sm ${data.totals.duplicateRows > 0 ? "border-t-4 border-t-[#D95C24] bg-[#D95C24]/5" : "border-t-4 border-t-border-default"}`}>
                 <p className={`text-[12px] font-bold uppercase tracking-widest mb-1.5 ${data.totals.duplicateRows > 0 ? "text-[#D95C24]" : "text-text-secondary"}`}>Conflitos</p>
                 <p className={`font-display font-bold tabular-nums text-[32px] md:text-[40px] leading-none ${data.totals.duplicateRows > 0 ? "text-[#D95C24]" : "text-text-primary"}`}>{data.totals.duplicateRows}</p>
             </div>
          </section>

          {/* Resolução de Pendências */}
          {(data.totals.duplicateRows > 0 || data.totals.invalidRows > 0) ? (
             <div className="bg-[#FFF4ED] border border-[#F2B544] p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div>
                   <h3 className="font-display font-bold text-[20px] text-[#A6411C]">Atenção Necessária</h3>
                   <p className="text-[15px] text-[#A6411C]/80 mt-1">Existem dados formatados incorretamente ou conflitos que exigem sua supervisão imediata.</p>
                </div>
                {data.totals.duplicateRows > 0 ? (
                  <Button asChild className="bg-[#D95C24] text-white hover:bg-[#A6411C] whitespace-nowrap font-bold h-12 px-6 shadow-sm">
                     <Link to={`/app/import/${encodeURIComponent(data.importId)}/conflicts`}>Resolver Duplicidades</Link>
                  </Button>
                ) : null}
             </div>
          ) : null}

          {/* Confirm Block */}
          {data.readyToCommit && !confirmCommit ? (
             <div className="pt-6 border-t border-border-default text-center">
                <Button 
                   onClick={() => setConfirmCommit(true)} 
                   disabled={committing}
                   className="w-full md:w-auto font-display font-bold text-[18px] px-12 h-16 bg-brand-primary text-white hover:bg-[#D95C24] shadow-md transition-transform active:scale-95"
                >
                   Gravar Nova Estrutura
                </Button>
             </div>
          ) : !data.readyToCommit ? (
             <div className="pt-6 border-t border-border-default text-center">
                <p className="text-[15px] font-semibold text-text-secondary bg-bg-surface px-6 py-4 rounded-md inline-block border border-border-default">
                  Corrija as linhas defeituosas acima para habilitar o painel de gravação.
                </p>
             </div>
          ) : null}

          {data.readyToCommit && confirmCommit ? (
            <div className="mt-4 p-8 border-[3px] border-brand-primary rounded-xl bg-brand-primary/5 text-center shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
               <h3 className="font-display font-bold text-[24px] text-text-primary mb-2">Processar Alterações?</h3>
               <p className="text-[16px] text-text-secondary mb-8">Essa ação adicionará os ativos selecionados no seu cofre operacional.</p>
               <div className="flex flex-col md:flex-row justify-center gap-4">
                  <Button onClick={onCommit} disabled={committing} className="font-bold bg-brand-primary h-14 px-8 text-[16px] shadow-sm">
                     {committing ? "Gravando Cofre..." : "Confirmar Gravação"}
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmCommit(false)} disabled={committing} className="font-bold h-14 px-8 text-text-secondary bg-white">
                     Voltar Atrás
                  </Button>
               </div>
            </div>
          ) : null}

          {/* Detalhes de Linha */}
          <section className="mt-10">
             <h3 className="font-display font-bold text-[22px] text-text-primary mb-4 border-b border-border-default pb-2">Diagnóstico Linha a Linha</h3>
             <ul className="flex flex-col border border-border-default rounded-md overflow-hidden bg-white shadow-sm">
                {data.rows.map((r, i) => (
                   <li key={r.id} className={`p-4 ${i !== data.rows.length - 1 ? "border-b border-border-default/50" : ""} flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-surface transition-colors`}>
                      <div className="flex items-center gap-4 min-w-0">
                         <span className="text-[13px] font-mono font-bold text-text-secondary bg-bg-primary border border-border-default px-2 py-1.5 rounded w-16 text-center shadow-xs">L: {r.rowNumber}</span>
                         <span className="font-medium text-[14px] text-text-primary truncate">{Object.keys(r.source).join(", ") || "Linha vazia"}</span>
                      </div>
                      <div className="text-right flex flex-col md:items-end min-w-max">
                         <span className={`text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.resolutionStatus === 'VALID' ? "bg-state-success/10 text-state-success" : "bg-state-error/10 text-state-error"}`}>{r.resolutionStatus}</span>
                         {r.errorMessage && <span className="text-[13px] font-medium text-state-error mt-1">{r.errorMessage}</span>}
                      </div>
                   </li>
                ))}
             </ul>
          </section>

          {/* Informações Funcionais / DEV */}
          {ops && (ops as any).screenState === "ready" ? (
             <div className="mt-10 pt-8 border-t border-border-default opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-2">Logs do Motor Integrador</p>
                <div className="flex flex-wrap gap-4">
                  <Link to={`/app/import/${encodeURIComponent(data.importId)}/ops`} className="text-[13px] text-brand-primary hover:underline font-semibold transition-all">Resumo Técnico</Link>
                  <span className="text-border-default">|</span>
                  <Link to={`/app/import/${encodeURIComponent(data.importId)}/detail`} className="text-[13px] text-brand-primary hover:underline font-semibold transition-all">Raw Data Ops</Link>
                </div>
             </div>
          ) : null}

        </div>
      ) : null}
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}
