import React, { useEffect, useMemo, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { PortfolioData, PortfolioGroup, PortfolioHolding } from '../../core/data/contracts';
import { ShellLayout } from '../../app/ShellLayout';

type PerfFilter = 'all' | 'best' | 'worst';

export interface PortfolioScreenProps {
  dataSources: AppDataSources;
  onBack(): void;
  onOpenHolding(input: { portfolioId: string; holdingId: string }): void;
  onGoToHome(): void;
  onGoToRadar(): void;
}

export function PortfolioScreen(props: PortfolioScreenProps): JSX.Element {
  const [perf, setPerf] = useState<PerfFilter>('all');
  const [query, setQuery] = useState('');
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: PortfolioData }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const res = await props.dataSources.portfolio.getPortfolio({ performance: perf });
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
  }, [perf, props.dataSources]);

  const filtered = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const d = state.data;
    if (d.screenState !== 'ready') return d;

    const q = query.trim().toLowerCase();
    const groups = d.groups
      .map((g) => ({
        ...g,
        holdings: filterHoldings(g.holdings, q)
      }))
      .filter((g) => g.holdings.length > 0);

    return { ...d, groups };
  }, [state, query]);

  return (
    <ShellLayout
      title="Carteira"
      activeRouteId="portfolio"
      onNavigate={(href) => {
        if (href === '/home') props.onGoToHome();
        else if (href === '/radar') props.onGoToRadar();
      }}
      rightSlot={
        <button className="btn btnGhost" onClick={props.onBack}>
          Voltar
        </button>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <FilterPill label="Todos" selected={perf === 'all'} onClick={() => setPerf('all')} />
                <FilterPill label="Melhores" selected={perf === 'best'} onClick={() => setPerf('best')} />
                <FilterPill label="Piores" selected={perf === 'worst'} onClick={() => setPerf('worst')} />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou codigo"
                style={{
                  width: 'min(360px, 100%)',
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid rgba(11,18,24,0.14)',
                  background: 'rgba(255,255,255,0.72)',
                  font: 'inherit'
                }}
              />
            </div>
          </div>

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
            <PortfolioContent data={filtered ?? state.data} onOpenHolding={props.onOpenHolding} />
          )}
      </div>
    </ShellLayout>
  );
}

function PortfolioContent(props: { data: PortfolioData; onOpenHolding(input: { portfolioId: string; holdingId: string }): void }): JSX.Element {
  const d = props.data;

  if (d.screenState === 'redirect_onboarding') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Antes de tudo</div>
        <div style={{ color: 'var(--c-slate)' }}>Complete seu contexto para personalizar a leitura.</div>
      </div>
    );
  }

  if (d.screenState === 'empty') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>{d.emptyState.title}</div>
        <div style={{ color: 'var(--c-slate)' }}>{d.emptyState.body}</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btnPrimary">{d.emptyState.ctaLabel}</button>
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
          <Kpi label="Patrimonio" value={formatMoney(d.summary.totalEquity)} />
          <Kpi label="Investido" value={formatMoney(d.summary.totalInvested)} />
          <Kpi label="P&L" value={`${formatMoney(d.summary.totalProfitLoss)} (${formatPct(d.summary.totalProfitLossPct)})`} />
        </div>
      </div>

      {d.groups.map((g) => (
        <GroupCard key={g.categoryKey} group={g} portfolioId={d.portfolioId} onOpenHolding={props.onOpenHolding} />
      ))}
    </div>
  );
}

function GroupCard(props: { group: PortfolioGroup; portfolioId: string; onOpenHolding(input: { portfolioId: string; holdingId: string }): void }): JSX.Element {
  return (
    <section className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900 }}>{props.group.categoryLabel}</div>
          <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>{props.group.holdings.length} posicoes</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>
          {formatMoney(props.group.totalCurrent)} {' | '} {formatPct(props.group.totalProfitLossPct)}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {props.group.holdings.map((h) => (
          <HoldingRow key={h.id} holding={h} onClick={() => props.onOpenHolding({ portfolioId: props.portfolioId, holdingId: h.id })} />
        ))}
      </div>
    </section>
  );
}

function HoldingRow(props: { holding: PortfolioHolding; onClick(): void }): JSX.Element {
  const h = props.holding;
  const perf = h.performancePct ?? null;

  return (
    <button
      type="button"
      className="btn btnGhost"
      onClick={props.onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 14,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 10,
        alignItems: 'center'
      }}
    >
      <div>
        <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>
          {h.code ? `${h.code} ` : ''}
          <span style={{ fontWeight: 800, color: 'var(--c-slate)' }}>{h.name}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate)' }}>
          {formatMoney(h.currentValue)}
          {h.allocationPct != null ? ` • ${formatPct(h.allocationPct)}` : ''}
          {h.platformName ? ` • ${h.platformName}` : ''}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 900 }}>{perf == null ? '—' : formatPct(perf)}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: perf == null ? 'var(--c-slate)' : perf >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>
          {h.quotationStatus}
        </div>
      </div>
    </button>
  );
}

function FilterPill(props: { label: string; selected: boolean; onClick(): void }): JSX.Element {
  return (
    <button
      type="button"
      className="btn btnGhost"
      onClick={props.onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        fontWeight: 900,
        borderColor: props.selected ? 'rgba(11,18,24,0.28)' : 'rgba(11,18,24,0.14)',
        background: props.selected ? 'rgba(11,18,24,0.06)' : 'rgba(255,255,255,0.72)'
      }}
    >
      {props.label}
    </button>
  );
}

function filterHoldings(holdings: PortfolioHolding[], q: string): PortfolioHolding[] {
  if (!q) return holdings;
  return holdings.filter((h) => {
    const hay = `${h.code ?? ''} ${h.name}`.toLowerCase();
    return hay.includes(q);
  });
}

function Kpi(props: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(11,18,24,0.10)', background: 'rgba(255,255,255,0.7)' }}>
      <div style={{ fontSize: 12, color: 'var(--c-slate)', marginBottom: 6 }}>{props.label}</div>
      <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.2 }}>{props.value}</div>
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
