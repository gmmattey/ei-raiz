import React, { useEffect, useMemo, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type {
  ProfileContextPayload,
  ProfileContextPutRequest,
  ProfilePlatformsUsed
} from '../../core/data/contracts';

type StepId = 'goal' | 'income_horizon' | 'risk_quiz' | 'platforms' | 'confirm';

const STEPS: Array<{ id: StepId; title: string; hint: string }> = [
  { id: 'goal', title: 'Seu objetivo', hint: 'Uma escolha simples para calibrar a leitura.' },
  { id: 'income_horizon', title: 'Renda e horizonte', hint: 'Só o suficiente para evitar recomendação errada.' },
  { id: 'risk_quiz', title: 'Risco', hint: 'Sem quiz pesado agora. Só um norte.' },
  { id: 'platforms', title: 'Plataformas', hint: 'Para sugerir o melhor caminho de importação.' },
  { id: 'confirm', title: 'Revisao', hint: 'Confirme o contexto antes de seguir.' }
];

export interface OnboardingScreenProps {
  dataSources: AppDataSources;
  onDone(): void;
  onSkip(): void;
}

export function OnboardingScreen(props: OnboardingScreenProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const [context, setContext] = useState<ProfileContextPayload>({
    financialGoal: null,
    monthlyIncomeRange: null,
    monthlyInvestmentTarget: null,
    availableToInvest: null,
    riskProfileSelfDeclared: null,
    riskProfileQuizResult: null,
    riskProfileEffective: null,
    investmentHorizon: null,
    platformsUsed: null,
    displayPreferences: null
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await props.dataSources.profile.getProfileContext();
        if (cancelled) return;
        if (!res.ok) {
          setError(`${res.error.code}: ${res.error.message}`);
          setLoading(false);
          return;
        }
        setContext(res.data.context ?? context);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Falha ao carregar contexto');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dataSources]);

  const current = STEPS[stepIndex];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / STEPS.length) * 100), [stepIndex]);

  async function saveStep(step: StepId, patch: Partial<ProfileContextPayload>): Promise<boolean> {
    setError(null);
    const input: ProfileContextPutRequest = { step, context: patch };
    try {
      const res = await props.dataSources.profile.putProfileContext(input);
      if (!res.ok) {
        setError(`${res.error.code}: ${res.error.message}`);
        return false;
      }
      // backend pode devolver contexto normalizado; respeita isso
      setContext((c) => ({ ...c, ...patch, ...res.data.context }));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar');
      return false;
    }
  }

  async function next(): Promise<void> {
    if (!current) return;

    // salva no fim de cada passo para manter UX leve e evitar roundtrip por clique.
    if (current.id === 'goal') {
      const ok = await saveStep('goal', { financialGoal: context.financialGoal });
      if (!ok) return;
    }
    if (current.id === 'income_horizon') {
      const ok = await saveStep('income_horizon', {
        monthlyIncomeRange: context.monthlyIncomeRange,
        monthlyInvestmentTarget: context.monthlyInvestmentTarget,
        availableToInvest: context.availableToInvest,
        investmentHorizon: context.investmentHorizon
      });
      if (!ok) return;
    }
    if (current.id === 'risk_quiz') {
      // Backend valida `riskProfileQuizResult` nesta etapa; mantemos selfDeclared em paralelo para futuras leituras.
      const v = context.riskProfileSelfDeclared;
      const ok = await saveStep('risk_quiz', { riskProfileSelfDeclared: v, riskProfileQuizResult: v });
      if (!ok) return;
    }
    if (current.id === 'platforms') {
      const ok = await saveStep('platforms', { platformsUsed: context.platformsUsed });
      if (!ok) return;
    }
    if (current.id === 'confirm') {
      // Backend nao tem etapa `confirm` hoje; aqui e so uma revisao final sem roundtrip.
      props.onDone();
      return;
    }

    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back(): void {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

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
            <div>
              <div style={{ fontWeight: 900 }}>Onboarding</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{progress}%</div>
            </div>
          </div>
          <button className="btn btnGhost" onClick={props.onSkip}>
            Ver exemplo primeiro
          </button>
        </header>

        <main style={{ marginTop: 14 }}>
          {loading ? (
            <div className="card" style={{ padding: 16 }}>
              Carregando...
            </div>
          ) : (
            <div className="card" style={{ padding: 16 }}>
              <div className="pill">
                <span className="pillDot" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{current.title}</span>
              </div>
              <div style={{ marginTop: 10, color: 'var(--c-slate)' }}>{current.hint}</div>

              {error ? (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: 'rgba(232,92,92,0.10)', border: '1px solid rgba(232,92,92,0.25)' }}>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Nao foi possivel salvar</div>
                  <div style={{ color: 'var(--c-slate)' }}>{error}</div>
                </div>
              ) : null}

              <div style={{ marginTop: 14 }}>
                {current.id === 'goal' ? (
                  <GoalStep value={context.financialGoal} onChange={(v) => setContext((c) => ({ ...c, financialGoal: v }))} />
                ) : null}
                {current.id === 'income_horizon' ? (
                  <IncomeHorizonStep
                    value={context}
                    onChange={(patch) => setContext((c) => ({ ...c, ...patch }))}
                  />
                ) : null}
                {current.id === 'risk_quiz' ? (
                  <RiskStep value={context.riskProfileSelfDeclared} onChange={(v) => setContext((c) => ({ ...c, riskProfileSelfDeclared: v }))} />
                ) : null}
                {current.id === 'platforms' ? (
                  <PlatformsStep
                    value={context.platformsUsed}
                    onChange={(v) => setContext((c) => ({ ...c, platformsUsed: v }))}
                  />
                ) : null}
                {current.id === 'confirm' ? <ConfirmStep context={context} /> : null}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btnGhost" onClick={back} disabled={stepIndex === 0}>
                    Voltar
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btnPrimary" onClick={() => void next()}>
                    {current.id === 'confirm' ? 'Concluir' : 'Continuar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ChoiceRow(props: { label: string; hint?: string; selected: boolean; onClick(): void }): JSX.Element {
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
        borderColor: props.selected ? 'rgba(245,106,42,0.55)' : 'rgba(11,18,24,0.14)',
        background: props.selected ? 'rgba(245,106,42,0.10)' : 'rgba(255,255,255,0.72)'
      }}
    >
      <div style={{ fontWeight: 900 }}>{props.label}</div>
      {props.hint ? <div style={{ fontSize: 12, color: 'var(--c-slate)', marginTop: 4 }}>{props.hint}</div> : null}
    </button>
  );
}

function GoalStep(props: { value: string | null; onChange(v: string): void }): JSX.Element {
  const options = [
    { v: 'crescer patrimonio', label: 'Crescer patrimonio', hint: 'Aumentar capital com consistencia.' },
    { v: 'equilibrar e crescer', label: 'Equilibrar e crescer', hint: 'Crescer sem aumentar risco demais.' },
    { v: 'proteger patrimonio', label: 'Proteger patrimonio', hint: 'Reduzir volatilidade e riscos.' }
  ];
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {options.map((o) => (
        <ChoiceRow key={o.v} label={o.label} hint={o.hint} selected={props.value === o.v} onClick={() => props.onChange(o.v)} />
      ))}
    </div>
  );
}

function IncomeHorizonStep(props: { value: ProfileContextPayload; onChange(patch: Partial<ProfileContextPayload>): void }): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Faixa de renda</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {['ate_5k', '5k-10k', '10k-15k', '15k+'].map((v) => (
            <ChoiceRow
              key={v}
              label={v.replace('_', ' ')}
              selected={props.value.monthlyIncomeRange === v}
              onClick={() => props.onChange({ monthlyIncomeRange: v })}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <NumberField
          label="Aporte mensal (meta)"
          value={props.value.monthlyInvestmentTarget}
          onChange={(n) => props.onChange({ monthlyInvestmentTarget: n })}
        />
        <NumberField
          label="Disponivel agora"
          value={props.value.availableToInvest}
          onChange={(n) => props.onChange({ availableToInvest: n })}
        />
      </div>

      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Horizonte</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { v: 'curto_prazo', label: 'Curto prazo', hint: '0 a 2 anos' },
            { v: 'medio_prazo', label: 'Medio prazo', hint: '2 a 5 anos' },
            { v: 'longo_prazo', label: 'Longo prazo', hint: '5+ anos' }
          ].map((o) => (
            <ChoiceRow
              key={o.v}
              label={o.label}
              hint={o.hint}
              selected={props.value.investmentHorizon === o.v}
              onClick={() => props.onChange({ investmentHorizon: o.v })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskStep(props: { value: string | null; onChange(v: string): void }): JSX.Element {
  const options = [
    { v: 'conservador', label: 'Conservador', hint: 'Prioriza estabilidade.' },
    { v: 'moderado', label: 'Moderado', hint: 'Equilibrio entre risco e retorno.' },
    { v: 'arrojado', label: 'Arrojado', hint: 'Aceita volatilidade para buscar retorno.' }
  ];
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {options.map((o) => (
        <ChoiceRow key={o.v} label={o.label} hint={o.hint} selected={props.value === o.v} onClick={() => props.onChange(o.v)} />
      ))}
    </div>
  );
}

function PlatformsStep(props: { value: ProfilePlatformsUsed | null; onChange(v: ProfilePlatformsUsed): void }): JSX.Element {
  const current = props.value ?? { platformIds: [], otherPlatforms: [] };
  function toggle(id: string) {
    const set = new Set(current.platformIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    props.onChange({ ...current, platformIds: Array.from(set) });
  }
  const items = [
    { id: 'xp', label: 'XP' },
    { id: 'ion', label: 'Ion' },
    { id: 'btg', label: 'BTG' },
    { id: 'nubank', label: 'Nu / Nubank' }
  ];

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((it) => (
        <ChoiceRow
          key={it.id}
          label={it.label}
          selected={current.platformIds.includes(it.id)}
          onClick={() => toggle(it.id)}
        />
      ))}
      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate)' }}>
        Dica: isso ajuda o produto a sugerir o caminho mais simples de importacao.
      </div>
    </div>
  );
}

function ConfirmStep(props: { context: ProfileContextPayload }): JSX.Element {
  const c = props.context;
  return (
    <div className="card" style={{ padding: 14, background: 'rgba(245,240,235,0.65)', borderColor: 'rgba(11,18,24,0.08)' }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Resumo</div>
      <div style={{ display: 'grid', gap: 6, color: 'var(--c-slate)', lineHeight: 1.55 }}>
        <Row k="Objetivo" v={c.financialGoal ?? 'nao informado'} />
        <Row k="Renda" v={c.monthlyIncomeRange ?? 'nao informado'} />
        <Row k="Horizonte" v={c.investmentHorizon ?? 'nao informado'} />
        <Row k="Risco" v={c.riskProfileSelfDeclared ?? 'nao informado'} />
        <Row k="Plataformas" v={(c.platformsUsed?.platformIds ?? []).join(', ') || 'nao informado'} />
      </div>
    </div>
  );
}

function Row(props: { k: string; v: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontWeight: 800 }}>{props.k}</span>
      <span>{props.v}</span>
    </div>
  );
}

function NumberField(props: { label: string; value: number | null; onChange(v: number | null): void }): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--c-slate)', fontWeight: 800 }}>{props.label}</span>
      <input
        value={props.value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (!raw) {
            props.onChange(null);
            return;
          }
          const n = Number(raw.replace(',', '.'));
          props.onChange(Number.isFinite(n) ? n : null);
        }}
        inputMode="decimal"
        placeholder="0"
        style={{
          padding: '12px 12px',
          borderRadius: 14,
          border: '1px solid rgba(11,18,24,0.14)',
          background: 'rgba(255,255,255,0.72)',
          font: 'inherit'
        }}
      />
    </label>
  );
}

