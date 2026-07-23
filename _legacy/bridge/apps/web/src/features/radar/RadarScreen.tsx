import React, { useEffect, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { AnalysisData, DashboardHomeData, HistoryTimelineData, ProfileContextGetData } from '../../core/data/contracts';

export interface RadarScreenProps {
  dataSources: AppDataSources;
  onBack(): void;
  onGoToTarget(path: string): void;
}

export function RadarScreen(props: RadarScreenProps): JSX.Element {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: AnalysisData; dashboard: DashboardHomeData | null; profile: ProfileContextGetData | null; timeline: HistoryTimelineData | null }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const [analysisRes, dashboardRes, profileRes, timelineRes] = await Promise.all([
          props.dataSources.analysis.getAnalysis(),
          props.dataSources.dashboard.getDashboardHome().catch((e) => ({
            ok: false,
            meta: { requestId: 'req_dash_failed', timestamp: new Date().toISOString(), version: 'v1' },
            error: { code: 'dashboard_failed', message: e instanceof Error ? e.message : 'Falha ao carregar dashboard' }
          })),
          props.dataSources.profile.getProfileContext().catch((e) => ({
            ok: false,
            meta: { requestId: 'req_profile_failed', timestamp: new Date().toISOString(), version: 'v1' },
            error: { code: 'profile_failed', message: e instanceof Error ? e.message : 'Falha ao carregar perfil' }
          })),
          props.dataSources.history.getHistoryTimeline({ limit: 60 }).catch((e) => ({
            ok: false,
            meta: { requestId: 'req_timeline_failed', timestamp: new Date().toISOString(), version: 'v1' },
            error: { code: 'timeline_failed', message: e instanceof Error ? e.message : 'Falha ao carregar histórico' }
          }))
        ]);
        if (cancelled) return;
        if (!analysisRes.ok) {
          setState({ kind: 'error', message: `${analysisRes.error.code}: ${analysisRes.error.message}` });
          return;
        }
        setState({
          kind: 'ready',
          data: analysisRes.data,
          dashboard: dashboardRes.ok ? dashboardRes.data : null,
          profile: profileRes.ok ? profileRes.data : null,
          timeline: timelineRes.ok ? timelineRes.data : null
        });
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
            <div style={{ fontWeight: 900 }}>Radar</div>
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
            <RadarContent data={state.data} dashboard={state.dashboard} profile={state.profile} timeline={state.timeline} onGoToTarget={props.onGoToTarget} />
          )}
        </main>
      </div>
    </div>
  );
}

function RadarContent(props: { data: AnalysisData; dashboard: DashboardHomeData | null; profile: ProfileContextGetData | null; timeline: HistoryTimelineData | null; onGoToTarget(path: string): void }): JSX.Element {
  const d = props.data;

  if (d.screenState === 'redirect_onboarding') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Antes de tudo</div>
        <div style={{ color: 'var(--c-slate)' }}>Complete seu contexto para personalizar o score.</div>
      </div>
    );
  }

  if (d.screenState === 'pending') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Analise em processamento</div>
        <div style={{ color: 'var(--c-slate)' }}>{d.pendingState.body}</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={() => props.onGoToTarget(d.pendingState.target)}>
            {d.pendingState.ctaLabel}
          </button>
        </div>
      </div>
    );
  }

  // ready
  const breakdown = deriveScoreBreakdown(d);
  const structure = deriveStructureImpact(props.dashboard);
  const concentrationAlert = deriveConcentrationAlert(props.dashboard);
  const reality = deriveRealityImpact(props.profile, props.dashboard);
  const behavior = deriveBehaviorImpact(props.timeline);
  const evolution = deriveScoreEvolution(props.timeline);
  return (
    <>
      <section className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, letterSpacing: -0.25 }}>Seu score</div>
            <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.5 }}>{d.score.explanation}</div>
          </div>
          <ScoreBadge value={d.score.value} status={d.score.status} />
        </div>
      </section>

      {concentrationAlert ? (
        <section className="card" style={{ padding: 16, borderColor: 'rgba(245,106,42,0.45)', background: 'rgba(255,255,255,0.78)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Alerta</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{concentrationAlert.title}</div>
              <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{concentrationAlert.body}</div>
            </div>
            <div>
              <button className="btn btnPrimary" onClick={() => props.onGoToTarget('/portfolio')}>
                Ver carteira
              </button>
            </div>
          </div>
          {concentrationAlert.tips.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Acao viavel agora</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.55 }}>
                {concentrationAlert.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>O que compoe a nota</div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Ajuda</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.55 }}>
              {breakdown.positives.map((item, idx) => (
                <li key={idx}>
                  <div style={{ fontWeight: 900, color: 'var(--c-ink)' }}>{item.title}</div>
                  <div>{item.body}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Atrasa</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.55 }}>
              {breakdown.negatives.map((item, idx) => (
                <li key={idx}>
                  <div style={{ fontWeight: 900, color: 'var(--c-ink)' }}>{item.title}</div>
                  <div>{item.body}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {structure ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Estrutura x score</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{structure.title}</div>
          <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{structure.body}</div>
          {structure.tips.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Como melhorar</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.55 }}>
                {structure.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {reality ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Sua realidade x score</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{reality.title}</div>
          <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{reality.body}</div>
          {reality.tips.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Como usar isso</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.55 }}>
                {reality.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {reality.cta ? (
            <div style={{ marginTop: 12 }}>
              <button className="btn btnPrimary" onClick={() => props.onGoToTarget(reality.cta.target)}>
                {reality.cta.label}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {behavior ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Comportamento x score</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{behavior.title}</div>
          <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{behavior.body}</div>
          {behavior.tips.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>O que depende de voce</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.55 }}>
                {behavior.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {evolution ? (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Evolucao do score</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{evolution.title}</div>
          <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{evolution.body}</div>
          {evolution.points.length ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {evolution.points.map((p) => (
                <div key={p.id} style={{ padding: '8px 10px', border: '1px solid rgba(31, 33, 37, 0.12)', borderRadius: 14, background: 'rgba(255,255,255,0.7)' }}>
                  <div style={{ fontWeight: 900, letterSpacing: -0.25 }}>{p.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>{p.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Problema principal</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{d.primaryProblem.title}</div>
        <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{d.primaryProblem.body}</div>
      </section>

      <section className="card" style={{ padding: 16, borderColor: 'rgba(245,106,42,0.35)' }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Acao principal</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: -0.2 }}>{d.primaryAction.title}</div>
        <div style={{ marginTop: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>{d.primaryAction.body}</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={() => props.onGoToTarget(d.primaryAction.target)}>
            {d.primaryAction.ctaLabel}
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Plano rapido</div>
        <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--c-slate)', lineHeight: 1.6 }}>
          {d.actionPlan.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ol>
      </section>
    </>
  );
}

function ScoreBadge(props: { value: number; status: string }): JSX.Element {
  const v = Math.max(0, Math.min(100, props.value));
  const tone = v >= 80 ? 'good' : v >= 60 ? 'warn' : 'bad';
  const bg =
    tone === 'good' ? 'rgba(111,207,151,0.16)'
      : tone === 'warn' ? 'rgba(242,181,68,0.18)'
        : 'rgba(232,92,92,0.16)';
  const border =
    tone === 'good' ? 'rgba(111,207,151,0.35)'
      : tone === 'warn' ? 'rgba(242,181,68,0.35)'
        : 'rgba(232,92,92,0.35)';

  return (
    <div style={{ padding: '10px 12px', borderRadius: 16, background: bg, border: `1px solid ${border}`, textAlign: 'right' }}>
      <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: -0.3 }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>{props.status}</div>
    </div>
  );
}

function deriveScoreBreakdown(
  data: Extract<AnalysisData, { screenState: 'ready' }>
): { positives: Array<{ title: string; body: string }>; negatives: Array<{ title: string; body: string }> } {
  const positives: Array<{ title: string; body: string }> = [];
  const negatives: Array<{ title: string; body: string }> = [];

  // Negativo mais explícito (para não virar "caixa preta").
  if (data.primaryProblem?.title || data.primaryProblem?.body) {
    negatives.push({
      title: data.primaryProblem.title || 'Ponto de atencao',
      body: data.primaryProblem.body || 'Existe um fator que pressiona seu score.'
    });
  }

  for (const insight of data.insights || []) {
    const text = `${insight.kind} ${insight.title} ${insight.body}`.toLowerCase();
    const isNegative = text.includes('concentr') || text.includes('risco') || text.includes('press') || text.includes('perda') || text.includes('alto');
    const bucket = isNegative ? negatives : positives;
    bucket.push({
      title: insight.title || (isNegative ? 'Fator de risco' : 'Fator positivo'),
      body: insight.body
    });
  }

  if (!positives.length) {
    positives.push({
      title: 'Base estruturada',
      body: data.score.value >= 60 ? 'A carteira tem base suficiente para evoluir com ajustes incrementais.' : 'Ha sinais positivos, mas a base ainda pede organizacao.'
    });
  }
  if (!negatives.length) {
    negatives.push({
      title: 'Sem alertas dominantes',
      body: 'Nenhum fator negativo dominante foi identificado nesta leitura.'
    });
  }

  return {
    positives: dedupeByTitle(positives).slice(0, 4),
    negatives: dedupeByTitle(negatives).slice(0, 4)
  };
}

function dedupeByTitle(items: Array<{ title: string; body: string }>): Array<{ title: string; body: string }> {
  const seen = new Set<string>();
  const out: Array<{ title: string; body: string }> = [];
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function deriveStructureImpact(
  dashboard: DashboardHomeData | null
): null | { title: string; body: string; tips: string[] } {
  if (!dashboard) return null;
  if (dashboard.screenState !== 'ready' && dashboard.screenState !== 'portfolio_ready_analysis_pending') return null;

  const dist = dashboard.distribution || [];
  if (!dist.length) return null;

  const top = dist[0];
  const topPct = Number(top.sharePct || 0);
  const uniqueBuckets = dist.length;
  const hhi = dist.reduce((acc, item) => {
    const p = Math.max(0, Number(item.sharePct || 0)) / 100;
    return acc + p * p;
  }, 0);

  const tips: string[] = [];
  let title = 'Distribuicao equilibrada';
  let body = `Hoje sua carteira esta distribuida em ${uniqueBuckets} blocos. Isso tende a deixar o score mais estavel.`;

  if (topPct >= 40 || hhi >= 0.35) {
    title = 'Concentracao alta pressiona a nota';
    body = `${top.label} esta com cerca de ${Math.round(topPct)}% do patrimonio. Quando um bloco domina, o risco aumenta e o score tende a cair.`;
    tips.push('Defina um teto por classe e pare de reforcar o bloco dominante.');
    tips.push('Use novos aportes para crescer a parte sub-representada antes de vender.');
  } else if (topPct >= 25 || hhi >= 0.25) {
    title = 'Concentracao moderada';
    body = `${top.label} e um bloco relevante (~${Math.round(topPct)}%). Isso pode pressionar o score se continuar crescendo sozinho.`;
    tips.push('Direcione os proximos aportes para outros blocos para diluir a concentracao.');
  } else if (uniqueBuckets <= 3) {
    title = 'Poucos blocos na carteira';
    body = `A carteira esta concentrada em poucos blocos (${uniqueBuckets}). Isso aumenta oscilacao e tende a pressionar o score.`;
    tips.push('Crie pelo menos um bloco adicional (ex: renda fixa, acoes, fundos) para reduzir dependencia.');
  }

  return { title, body, tips };
}

function deriveConcentrationAlert(
  dashboard: DashboardHomeData | null
): null | { title: string; body: string; tips: string[] } {
  if (!dashboard) return null;
  if (dashboard.screenState !== 'ready' && dashboard.screenState !== 'portfolio_ready_analysis_pending') return null;
  const dist = dashboard.distribution || [];
  if (!dist.length) return null;

  const top = dist[0];
  const topPct = Number(top.sharePct || 0);
  const hhi = dist.reduce((acc, item) => {
    const p = Math.max(0, Number(item.sharePct || 0)) / 100;
    return acc + p * p;
  }, 0);

  if (topPct < 40 && hhi < 0.35) return null;

  const tips: string[] = [];
  tips.push('Pare de reforcar o bloco dominante nos proximos aportes.');
  tips.push('Direcione aportes para blocos menores ate reduzir a concentracao.');
  tips.push('Defina um teto por classe (ex: 35%) e use isso como regra simples.');

  return {
    title: 'Concentracao excessiva',
    body: `${top.label} esta com cerca de ${Math.round(topPct)}% do patrimonio. Isso aumenta o risco e tende a pressionar o score se continuar crescendo sozinho.`,
    tips: tips.slice(0, 3)
  };
}

function deriveRealityImpact(
  profile: ProfileContextGetData | null,
  dashboard: DashboardHomeData | null
): null | { title: string; body: string; tips: string[]; cta: null | { label: string; target: string } } {
  if (!profile) return null;
  if (!dashboard || (dashboard.screenState !== 'ready' && dashboard.screenState !== 'portfolio_ready_analysis_pending')) {
    return null;
  }

  const ctx = profile.context;
  const monthlyIncomeRange = ctx.monthlyIncomeRange;
  const monthlyInvestmentTarget = ctx.monthlyInvestmentTarget ?? null;
  const availableToInvest = ctx.availableToInvest ?? null;
  const equity = Number(dashboard.hero?.totalEquity || 0);

  const missing = !monthlyIncomeRange || !monthlyInvestmentTarget || monthlyInvestmentTarget <= 0;
  if (missing) {
    return {
      title: 'Sem contexto suficiente para personalizar',
      body: 'A mesma carteira pode ter leitura diferente para pessoas diferentes. Complete sua renda e meta de aporte para evitar uma análise genérica.',
      tips: ['Defina um alvo de aporte mensal que caiba na sua realidade.', 'Use o score como guia de decisão, não como julgamento.'],
      cta: { label: 'Completar contexto', target: '/onboarding' }
    };
  }

  const targetPct = equity > 0 ? monthlyInvestmentTarget / equity : null;
  const tips: string[] = [];

  let title = 'Aporte consistente acelera melhoria do score';
  let body = 'Seu alvo de aporte ajuda a definir o ritmo de melhoria do score sem depender de vender nada agora.';

  if (availableToInvest != null && monthlyInvestmentTarget > availableToInvest) {
    title = 'Meta de aporte acima da capacidade';
    body = `Seu alvo mensal (${formatMoney(monthlyInvestmentTarget)}) esta acima do que voce disse que consegue investir (${formatMoney(availableToInvest)}). Ajustar isso evita frustracao e torna o plano executavel.`;
    tips.push('Ajuste o alvo mensal para algo sustentavel por pelo menos 3 meses.');
    tips.push('Foque em diluir concentracao com aportes pequenos e repetidos.');
  } else if (targetPct != null && targetPct < 0.005) {
    title = 'Ritmo lento para mudar a estrutura';
    body = `Com patrimonio atual de ~${formatMoney(equity)}, um aporte mensal de ${formatMoney(monthlyInvestmentTarget)} tende a mudar a estrutura devagar. O score melhora, mas em passos menores.`;
    tips.push('Se fizer sentido, aumente o aporte ou crie um aporte extra pontual quando houver folga.');
    tips.push('Priorize aportes no bloco sub-representado para diluir concentracao.');
  } else if (targetPct != null && targetPct >= 0.015) {
    title = 'Ritmo forte para rebalancear com aportes';
    body = `Com patrimonio atual de ~${formatMoney(equity)}, seu aporte mensal (${formatMoney(monthlyInvestmentTarget)}) permite rebalancear sem pressa e tende a puxar o score para cima mais rápido.`;
    tips.push('Defina um teto por classe e use o aporte para trazer o que esta abaixo do alvo.');
  } else {
    title = 'Ritmo razoavel e previsivel';
    body = `Seu aporte mensal (${formatMoney(monthlyInvestmentTarget)}) cria um caminho previsivel para ajustar a carteira sem decisões abruptas.`;
    tips.push('Mantenha consistencia e reavalie a distribuicao a cada 30 dias.');
  }

  if (monthlyIncomeRange) {
    tips.push(`Renda declarada: ${monthlyIncomeRange}. Use isso como referencia para manter metas realistas.`);
  }

  return { title, body, tips: tips.slice(0, 4), cta: null };
}

function formatMoney(value: number): string {
  const v = Number(value || 0);
  if (!Number.isFinite(v)) return 'R$ 0';
  const rounded = Math.round(v);
  // Mantem simples (sem Intl para evitar dependencias e diferencas de runtime).
  return `R$ ${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function deriveBehaviorImpact(
  timeline: HistoryTimelineData | null
): null | { title: string; body: string; tips: string[] } {
  if (!timeline) return null;
  if (timeline.screenState !== 'ready') return null;

  const snapshots = (timeline.items || []).filter((item) => item.kind === 'snapshot') as Array<{
    kind: 'snapshot';
    occurredAt: string;
    referenceDate: string;
  }>;

  if (snapshots.length < 2) {
    return {
      title: 'Ainda nao da para medir regularidade',
      body: 'Sem pelo menos dois snapshots, o produto nao consegue diferenciar evolucao de acaso. Regularidade deixa o score mais confiavel e acionavel.',
      tips: ['Crie um habito simples: revisar e atualizar a carteira 1x por mes.', 'Use novos aportes para corrigir concentracao sem vender no impulso.']
    };
  }

  const last = snapshots[0];
  const prev = snapshots[1];
  const gapDays = diffDays(prev.occurredAt, last.occurredAt);

  let title = 'Regularidade moderada';
  let body = `O ultimo intervalo entre snapshots foi de ~${gapDays} dias. Quanto mais regular, mais o score reflete o que voce faz e menos ruído.`;
  const tips: string[] = [];

  if (gapDays <= 35) {
    title = 'Boa regularidade de acompanhamento';
    body = `O ultimo intervalo entre snapshots foi de ~${gapDays} dias. Isso ajuda o score a acompanhar sua evolucao e melhora a qualidade das recomendacoes.`;
    tips.push('Mantenha o ciclo mensal: aporte, revisar distribuicao, ajustar o proximo passo.');
  } else if (gapDays <= 75) {
    title = 'Regularidade ok, mas pode melhorar';
    body = `O ultimo intervalo entre snapshots foi de ~${gapDays} dias. Um ritmo mais constante tende a reduzir ansiedade e decisões reativas.`;
    tips.push('Escolha um dia fixo no mes para revisar e registrar a carteira.');
  } else {
    title = 'Baixa regularidade aumenta risco de decisões reativas';
    body = `O ultimo intervalo entre snapshots foi de ~${gapDays} dias. Quando voce olha pouco, tende a agir no pico da emoção e o score perde utilidade.`;
    tips.push('Volte para um ciclo mensal mesmo que o aporte seja pequeno.');
    tips.push('Registre o que mudou e por que (para evitar “mexer por mexer”).');
  }

  return { title, body, tips: tips.slice(0, 3) };
}

function deriveScoreEvolution(
  timeline: HistoryTimelineData | null
): null | { title: string; body: string; points: Array<{ id: string; value: number; label: string }> } {
  if (!timeline) return null;
  if (timeline.screenState !== 'ready') return null;

  const snapshotItems = (timeline.items || []).filter((item) => item.kind === 'snapshot') as Array<{
    kind: 'snapshot';
    id: string;
    referenceDate: string;
    recommendation: null | { scoreValue?: number | null; status: string };
  }>;

  const points = snapshotItems
    .map((item) => {
      const value = item.recommendation?.scoreValue;
      if (value == null) return null;
      return { id: item.id, value: Number(value), label: item.referenceDate };
    })
    .filter(Boolean) as Array<{ id: string; value: number; label: string }>;

  if (points.length < 2) {
    return {
      title: 'Evolucao ainda nao disponivel',
      body: 'Para enxergar tendencia do score, o produto precisa de pelo menos dois snapshots com analise registrada.',
      points: points.slice(0, 3)
    };
  }

  const latest = points[0];
  const previous = points[1];
  const delta = latest.value - previous.value;
  const direction = delta > 0 ? 'subiu' : delta < 0 ? 'caiu' : 'ficou estável';

  return {
    title: `Seu score ${direction}`,
    body: `Do snapshot anterior para o mais recente, a nota mudou ${delta === 0 ? '0' : `${Math.abs(delta).toFixed(0)}`} pontos. Use isso para validar se as mudanças estao funcionando.`,
    points: points.slice(0, 3)
  };
}

function diffDays(a: string, b: string): number {
  const da = safeDate(a);
  const db = safeDate(b);
  if (!da || !db) return 0;
  const ms = Math.abs(db.getTime() - da.getTime());
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function safeDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
