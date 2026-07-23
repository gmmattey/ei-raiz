import React, { useEffect, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { HoldingDetailData, HoldingDetailDataReady } from '../../core/data/contracts';

export interface HoldingDetailScreenProps {
  dataSources: AppDataSources;
  input: { portfolioId: string; holdingId: string };
  onBack(): void;
  onOpenExternal(url: string): void;
}

export function HoldingDetailScreen(props: HoldingDetailScreenProps): JSX.Element {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: HoldingDetailData }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const res = await props.dataSources.holdingDetail.getHoldingDetail(props.input);
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
  }, [props.dataSources, props.input.holdingId, props.input.portfolioId]);

  return (
    <div className="app">
      <div className="container" style={{ paddingTop: 18, paddingBottom: 28 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/brand/esquilo-icon.png"
              alt="Esquilo"
              width={34}
              height={34}
              style={{ borderRadius: 12, background: 'rgba(255,255,255,0.85)', boxShadow: 'var(--shadow-1)' }}
            />
            <div style={{ fontWeight: 900 }}>Detalhe</div>
          </div>
          <button className="btn btnGhost" onClick={props.onBack}>
            Voltar
          </button>
        </header>

        <main style={{ marginTop: 14, display: 'grid', gap: 12 }}>
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
            <HoldingDetailContent data={state.data} onOpenExternal={props.onOpenExternal} />
          )}
        </main>
      </div>
    </div>
  );
}

function HoldingDetailContent(props: { data: HoldingDetailData; onOpenExternal(url: string): void }): JSX.Element {
  const d = props.data;

  if (d.screenState === 'redirect_onboarding') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Antes de tudo</div>
        <div style={{ color: 'var(--c-slate)' }}>Complete seu contexto para personalizar a leitura.</div>
      </div>
    );
  }

  return <HoldingDetailReady data={d} onOpenExternal={props.onOpenExternal} />;
}

function HoldingDetailReady(props: { data: HoldingDetailDataReady; onOpenExternal(url: string): void }): JSX.Element {
  const h = props.data.holding;
  const perfPct = h.performancePct ?? null;

  return (
    <>
      <section className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, letterSpacing: -0.25 }}>
              {h.code ? `${h.code} ` : ''}
              {h.name}
            </div>
            <div style={{ marginTop: 6, color: 'var(--c-slate)', fontSize: 12 }}>
              {h.categoryLabel}
              {h.platformName ? ` • ${h.platformName}` : ''}
              {h.sourceKind ? ` • ${h.sourceKind}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--c-slate)', fontSize: 12 }}>
            <div style={{ fontWeight: 900, color: 'var(--c-ink)' }}>{h.statusLabel}</div>
            <div>{h.quotationStatus}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <Kpi label="Posicao" value={formatMoney(h.currentValue)} hint={h.quantity != null && h.currentPrice != null ? `${h.quantity} x ${formatMoney(h.currentPrice)}` : undefined} />
          <Kpi
            label="Performance"
            value={perfPct == null ? '—' : formatPct(perfPct)}
            tone={perfPct == null ? 'neutral' : perfPct >= 0 ? 'good' : 'bad'}
            hint={h.allocationPct != null ? `Peso: ${formatPct(h.allocationPct)}` : undefined}
          />
          <Kpi label="Score" value={String(props.data.ranking.score)} hint={props.data.ranking.status} />
        </div>
      </section>

      <section className="card" style={{ padding: 16, borderColor: 'rgba(245,106,42,0.35)' }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Recomendacao</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{props.data.recommendation.title}</div>
        <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{props.data.recommendation.body}</div>
      </section>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Contexto da categoria</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <Kpi label="Categoria" value={props.data.categoryContext.categoryLabel} hint={`Risco: ${props.data.categoryContext.categoryRisk}`} />
          <Kpi label="Total atual" value={formatMoney(props.data.categoryContext.totalCurrent)} hint={`${props.data.categoryContext.holdingsCount} holdings`} />
          <Kpi label="P&L" value={`${formatMoney(props.data.categoryContext.totalProfitLoss)} (${formatPct(props.data.categoryContext.totalProfitLossPct)})`} />
        </div>
        <div style={{ marginTop: 10, color: 'var(--c-slate)', lineHeight: 1.55 }}>{props.data.categoryContext.primaryMessage}</div>
      </section>

      {props.data.externalLink ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Link externo</div>
          <button className="btn btnGhost" onClick={() => props.onOpenExternal(props.data.externalLink!)}>
            Abrir cotacao / referencia
          </button>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--c-slate)' }}>{props.data.externalLink}</div>
        </section>
      ) : null}
    </>
  );
}

function Kpi(props: { label: string; value: string; hint?: string; tone?: 'neutral' | 'good' | 'bad' }): JSX.Element {
  const tone = props.tone ?? 'neutral';
  const valueColor = tone === 'good' ? 'var(--c-success)' : tone === 'bad' ? 'var(--c-danger)' : 'var(--c-ink)';

  return (
    <div style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(11,18,24,0.10)', background: 'rgba(255,255,255,0.7)' }}>
      <div style={{ fontSize: 12, color: 'var(--c-slate)', marginBottom: 6, fontWeight: 800 }}>{props.label}</div>
      <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.2, color: valueColor }}>{props.value}</div>
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

