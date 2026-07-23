import React, { useEffect, useMemo, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { ImportPreviewRow } from '../../core/data/contracts';
import { ShellLayout } from '../../app/ShellLayout';
import { createImportsController } from './imports_controller';

export interface ImportsPreviewScreenProps {
  dataSources: AppDataSources;
  importId: string;
  onGoToTarget(path: string): void;
}

export function ImportsPreviewScreen(props: ImportsPreviewScreenProps): JSX.Element {
  const controller = useMemo(() => createImportsController({ imports: props.dataSources.imports }), [props.dataSources]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ totalRows: number; validRows: number; invalidRows: number; duplicateRows: number } | null>(null);
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [readyToCommit, setReadyToCommit] = useState(false);
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await controller.preview(props.importId);
        if (cancelled) return;
        if (!res.envelope.ok) {
          setError(`${res.envelope.error.code}: ${res.envelope.error.message}`);
          setLoading(false);
          return;
        }
        setTotals(res.totals ?? null);
        setRows(res.rows ?? []);
        setReadyToCommit(Boolean(res.readyToCommit));
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Falha ao carregar preview');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [controller, props.importId]);

  async function commit() {
    setCommitting(true);
    setError(null);
    try {
      const res = await controller.commit(props.importId);
      if (!res.envelope.ok) {
        setError(`${res.envelope.error.code}: ${res.envelope.error.message}`);
        setCommitting(false);
        return;
      }
      props.onGoToTarget(res.nextPathname ?? '/history');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao commitar');
      setCommitting(false);
    }
  }

  return (
    <ShellLayout title="Preview da importacao" activeRouteId="imports" onNavigate={(href) => props.onGoToTarget(href)}>
      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          Carregando...
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Nao foi possivel carregar</div>
          <div style={{ color: 'var(--c-slate)' }}>{error}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Resumo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
              <Kpi label="Import" value={props.importId} />
              <Kpi label="Total" value={String(totals?.totalRows ?? 0)} />
              <Kpi label="Validas" value={String(totals?.validRows ?? 0)} />
              <Kpi label="Problemas" value={String((totals?.invalidRows ?? 0) + (totals?.duplicateRows ?? 0))} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btnGhost" onClick={() => props.onGoToTarget('/imports')}>
                Voltar ao historico
              </button>
              <button className="btn btnPrimary" onClick={() => void commit()} disabled={!readyToCommit || committing}>
                {committing ? 'Commitando...' : readyToCommit ? 'Confirmar e commitar' : 'Ainda nao pronto para commit'}
              </button>
            </div>
          </div>

          <section className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Linhas (amostra)</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {rows.length === 0 ? (
                <div style={{ color: 'var(--c-slate)' }}>Nenhuma linha para exibir.</div>
              ) : (
                rows.slice(0, 12).map((r) => <RowCard key={r.id} row={r} />)
              )}
            </div>
          </section>
        </div>
      )}
    </ShellLayout>
  );
}

function RowCard(props: { row: ImportPreviewRow }): JSX.Element {
  const r = props.row;
  const isOk = r.resolutionStatus === 'VALID';
  const isDup = r.resolutionStatus === 'DUPLICATE';
  const tone = isOk ? { bg: 'rgba(111,207,151,0.12)', border: 'rgba(111,207,151,0.30)' }
    : isDup ? { bg: 'rgba(242,181,68,0.14)', border: 'rgba(242,181,68,0.30)' }
      : { bg: 'rgba(232,92,92,0.12)', border: 'rgba(232,92,92,0.30)' };

  return (
    <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${tone.border}`, background: tone.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 900 }}>Linha {r.rowNumber}</div>
        <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>{r.resolutionStatus}</div>
      </div>
      {r.errorMessage ? <div style={{ marginTop: 8, color: 'var(--c-danger)', fontSize: 12 }}>{r.errorMessage}</div> : null}
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--c-slate)', lineHeight: 1.55 }}>
        <div><strong>Source:</strong> {safeJson(r.source)}</div>
        <div><strong>Normalizado:</strong> {safeJson(r.normalized)}</div>
      </div>
    </div>
  );
}

function Kpi(props: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(11,18,24,0.10)', background: 'rgba(255,255,255,0.7)' }}>
      <div style={{ fontSize: 12, color: 'var(--c-slate)', marginBottom: 6, fontWeight: 800 }}>{props.label}</div>
      <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.2 }}>{props.value}</div>
    </div>
  );
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

