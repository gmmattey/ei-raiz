import React, { useEffect, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { ImportsCenterData, ImportsCenterImportItem } from '../../core/data/contracts';
import { ShellLayout } from '../../app/ShellLayout';

export interface ImportsCenterScreenProps {
  dataSources: AppDataSources;
  onGoToTarget(path: string): void;
}

export function ImportsCenterScreen(props: ImportsCenterScreenProps): JSX.Element {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: ImportsCenterData }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const res = await props.dataSources.importsCenter.getImportsCenter();
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: 'error', message: `${res.error.code}: ${res.error.message}` });
          return;
        }
        setState({ kind: 'ready', data: res.data });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Falha ao carregar' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.dataSources]);

  return (
    <ShellLayout title="Importacoes" activeRouteId="imports" onNavigate={(href) => props.onGoToTarget(href)}>
      {state.kind === 'loading' ? (
        <div className="card" style={{ padding: 16 }}>
          Carregando...
        </div>
      ) : state.kind === 'error' ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Nao foi possivel carregar</div>
          <div style={{ color: 'var(--c-slate)' }}>{state.message}</div>
        </div>
      ) : (
        <ImportsContent data={state.data} onGoToTarget={props.onGoToTarget} />
      )}
    </ShellLayout>
  );
}

function ImportsContent(props: { data: ImportsCenterData; onGoToTarget(path: string): void }): JSX.Element {
  const d = props.data;

  if (d.screenState === 'redirect_onboarding') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Antes de importar</div>
        <div style={{ color: 'var(--c-slate)' }}>Complete seu contexto para escolher o melhor caminho.</div>
      </div>
    );
  }

  if (d.screenState === 'empty') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>{d.emptyState.title}</div>
        <div style={{ color: 'var(--c-slate)', lineHeight: 1.55 }}>{d.emptyState.body}</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={() => props.onGoToTarget(d.emptyState.target)}>
            {d.emptyState.ctaLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Resumo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <Kpi label="Total" value={String(d.summary.totalImports)} />
          <Kpi label="Pendentes" value={String(d.summary.pendingImports)} />
          <Kpi label="Concluidas" value={String(d.summary.completedImports)} />
          <Kpi label="Falhas" value={String(d.summary.failedImports)} />
        </div>
      </div>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Importacoes</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {d.imports.map((it) => (
            <ImportRow key={it.id} it={it} onGoToTarget={props.onGoToTarget} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ImportRow(props: { it: ImportsCenterImportItem; onGoToTarget(path: string): void }): JSX.Element {
  const it = props.it;
  const tone =
    it.status === 'FAILED' ? { bg: 'rgba(232,92,92,0.16)', border: 'rgba(232,92,92,0.35)' }
      : it.status === 'COMMITTED' ? { bg: 'rgba(111,207,151,0.16)', border: 'rgba(111,207,151,0.35)' }
        : { bg: 'rgba(242,181,68,0.18)', border: 'rgba(242,181,68,0.35)' };

  return (
    <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${tone.border}`, background: tone.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontWeight: 900 }}>{it.originLabel}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate)' }}>
            {it.statusLabel}
            {it.fileName ? ` • ${it.fileName}` : ''}
            {` • ${formatDateTime(it.createdAt)}`}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>
          Linhas: {it.totals.validRows}/{it.totals.totalRows} {' • '} dup: {it.totals.duplicateRows}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btnPrimary" onClick={() => props.onGoToTarget(it.primaryAction.target)}>
          {it.primaryAction.title}
        </button>
        {it.secondaryAction ? (
          <button className="btn btnGhost" onClick={() => props.onGoToTarget(it.secondaryAction!.target)}>
            {it.secondaryAction.title}
          </button>
        ) : null}
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

function formatDateTime(input: string | null): string {
  if (!input) return '—';
  try {
    const d = new Date(input);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return input;
  }
}

