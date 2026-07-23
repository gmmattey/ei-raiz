import React, { useEffect, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { HistoryTimelineData } from '../../core/data/contracts';
import { ShellLayout } from '../../app/ShellLayout';

export interface HistoryScreenProps {
  dataSources: AppDataSources;
  onGoToTarget(path: string): void;
}

export function HistoryScreen(props: HistoryScreenProps): JSX.Element {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: HistoryTimelineData }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const res = await props.dataSources.history.getHistoryTimeline({ limit: 40 });
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
    <ShellLayout title="Historico" activeRouteId="history" onNavigate={(href) => props.onGoToTarget(href)}>
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
        <HistoryContent data={state.data} onGoToTarget={props.onGoToTarget} />
      )}
    </ShellLayout>
  );
}

function HistoryContent(props: { data: HistoryTimelineData; onGoToTarget(path: string): void }): JSX.Element {
  const d = props.data;

  if (d.screenState === 'redirect_onboarding') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Antes de tudo</div>
        <div style={{ color: 'var(--c-slate)' }}>Complete seu contexto para gerar leitura temporal.</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={() => props.onGoToTarget(d.redirectTo)}>
            Completar contexto
          </button>
        </div>
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

  // ready
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Resumo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <Kpi label="Itens" value={String(d.summary.totalItems)} hint={`${d.summary.totalSnapshots} snapshots • ${d.summary.totalEvents} eventos`} />
          <Kpi label="Ultimo" value={formatDateTime(d.summary.latestOccurredAt)} />
          <Kpi label="Portfolio" value={d.portfolioId} />
        </div>
      </div>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Timeline</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {d.items.map((it) => (
            it.kind === 'snapshot'
              ? <SnapshotItem key={it.id} it={it} />
              : <EventItem key={it.id} it={it} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SnapshotItem(props: { it: any }): JSX.Element {
  const it = props.it as {
    kind: 'snapshot';
    id: string;
    occurredAt: string;
    referenceDate: string;
    createdAt: string;
    totals: { totalEquity: number; totalInvested: number; totalProfitLoss: number; totalProfitLossPct: number };
    recommendation: null | { status: string; primaryProblem: string; primaryAction: string };
  };

  return (
    <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(11,18,24,0.10)', background: 'rgba(255,255,255,0.72)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900 }}>Snapshot</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate)' }}>
            Ref: <strong>{it.referenceDate}</strong> • {formatDateTime(it.occurredAt)}
          </div>
        </div>
        {it.recommendation ? (
          <div style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(242,181,68,0.18)', border: '1px solid rgba(242,181,68,0.35)', fontSize: 12, fontWeight: 900 }}>
            {it.recommendation.status}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <Kpi label="Patrimonio" value={formatMoney(it.totals.totalEquity)} />
        <Kpi label="Investido" value={formatMoney(it.totals.totalInvested)} />
        <Kpi label="P&L" value={`${formatMoney(it.totals.totalProfitLoss)} (${formatPct(it.totals.totalProfitLossPct)})`} />
      </div>

      {it.recommendation ? (
        <div style={{ marginTop: 10, color: 'var(--c-slate)', lineHeight: 1.55 }}>
          <div><strong>Problema:</strong> {it.recommendation.primaryProblem}</div>
          <div><strong>Acao:</strong> {it.recommendation.primaryAction}</div>
        </div>
      ) : null}
    </div>
  );
}

function EventItem(props: { it: any }): JSX.Element {
  const it = props.it as {
    kind: 'event';
    id: string;
    occurredAt: string;
    portfolioId: string | null;
    type: string;
    status: string;
    message: string | null;
  };

  const tone = it.status === 'ok' ? 'rgba(111,207,151,0.16)' : 'rgba(232,92,92,0.16)';
  const border = it.status === 'ok' ? 'rgba(111,207,151,0.35)' : 'rgba(232,92,92,0.35)';

  return (
    <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${border}`, background: tone }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900 }}>Evento</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate)' }}>
            {it.type} • {formatDateTime(it.occurredAt)}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 900 }}>{it.status}</div>
      </div>
      {it.message ? <div style={{ marginTop: 8, color: 'var(--c-slate)', lineHeight: 1.55 }}>{it.message}</div> : null}
    </div>
  );
}

function Kpi(props: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <div style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(11,18,24,0.10)', background: 'rgba(255,255,255,0.7)' }}>
      <div style={{ fontSize: 12, color: 'var(--c-slate)', marginBottom: 6, fontWeight: 800 }}>{props.label}</div>
      <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.2 }}>{props.value}</div>
      {props.hint ? <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate)' }}>{props.hint}</div> : null}
    </div>
  );
}

function formatMoney(v: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  } catch {
    return `R$ ${v.toFixed(2)}`;
  }
}

function formatPct(v: number): string {
  const n = Math.round(v * 100) / 100;
  const s = (n >= 0 ? `+${n}` : String(n)).replace('.', ',');
  return `${s}%`;
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

