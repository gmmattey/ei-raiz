import React, { useEffect, useMemo, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import type { ProfileContextPayload, ProfilePlatformsUsed } from '../../core/data/contracts';
import { ShellLayout } from '../../app/ShellLayout';

export interface ProfileScreenProps {
  dataSources: AppDataSources;
  onGoToTarget(path: string): void;
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'blocked_onboarding' }
  | { kind: 'ready' };

const EMPTY_CONTEXT: ProfileContextPayload = {
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
};

export function ProfileScreen(props: ProfileScreenProps): JSX.Element {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });
  const [draft, setDraft] = useState<ProfileContextPayload>(EMPTY_CONTEXT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const normalizedDraft = useMemo(() => normalizeContextForUi(draft), [draft]);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const res = await props.dataSources.profile.getProfileContext();
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: 'error', message: `${res.error.code}: ${res.error.message}` });
          return;
        }
        if (!res.data.onboarding?.completed) {
          setState({ kind: 'blocked_onboarding' });
          return;
        }
        setDraft(res.data.context ?? EMPTY_CONTEXT);
        setState({ kind: 'ready' });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Falha ao carregar perfil' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.dataSources]);

  async function save(): Promise<void> {
    setSaving(true);
    setSaveError(null);
    try {
      // Backend exige um step valido; usamos income_horizon como "passo neutro" e mandamos o draft completo.
      // Isso evita roundtrip por clique e mantem compatibilidade com as validacoes existentes.
      const res = await props.dataSources.profile.putProfileContext({ step: 'income_horizon', context: normalizeContextForApi(draft) });
      if (!res.ok) {
        setSaveError(`${res.error.code}: ${res.error.message}`);
        setSaving(false);
        return;
      }
      setDraft(res.data.context ?? draft);
      setSaving(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Falha ao salvar');
      setSaving(false);
    }
  }

  return (
    <ShellLayout title="Perfil" activeRouteId="profile" onNavigate={(href) => props.onGoToTarget(href)}>
      {state.kind === 'loading' ? (
        <div className="card" style={{ padding: 16 }}>Carregando...</div>
      ) : state.kind === 'error' ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Nao foi possivel carregar</div>
          <div style={{ color: 'var(--c-slate)' }}>{state.message}</div>
        </div>
      ) : state.kind === 'blocked_onboarding' ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Complete o onboarding primeiro</div>
          <div style={{ color: 'var(--c-slate)', lineHeight: 1.55 }}>
            O perfil editavel depende do contexto basico (objetivo e risco) para evitar recomendacao incompatível.
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btnPrimary" onClick={() => props.onGoToTarget('/onboarding')}>Ir para onboarding</button>
            <button className="btn btnGhost" onClick={() => props.onGoToTarget('/home')}>Voltar</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <section className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Contexto</div>

            {saveError ? (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 12, background: 'rgba(232,92,92,0.10)', border: '1px solid rgba(232,92,92,0.25)' }}>
                <div style={{ fontWeight: 900, marginBottom: 4 }}>Nao foi possivel salvar</div>
                <div style={{ color: 'var(--c-slate)' }}>{saveError}</div>
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 12 }}>
              <FieldGroup title="Objetivo">
                <ChoiceGrid
                  value={normalizedDraft.financialGoal}
                  options={[
                    { v: 'crescer', label: 'Crescer patrimonio' },
                    { v: 'renda', label: 'Gerar renda' },
                    { v: 'proteger', label: 'Proteger / estabilidade' }
                  ]}
                  onChange={(v) => setDraft((c) => ({ ...c, financialGoal: v }))}
                />
              </FieldGroup>

              <FieldGroup title="Risco">
                <ChoiceGrid
                  value={normalizedDraft.riskProfileSelfDeclared}
                  options={[
                    { v: 'conservador', label: 'Conservador' },
                    { v: 'moderado', label: 'Moderado' },
                    { v: 'arrojado', label: 'Arrojado' }
                  ]}
                  onChange={(v) => setDraft((c) => ({ ...c, riskProfileSelfDeclared: v }))}
                />
                <div style={{ fontSize: 12, color: 'var(--c-slate)', lineHeight: 1.55 }}>
                  Nota: por enquanto, usamos esse valor como base do “quiz” para manter o backend coerente.
                </div>
              </FieldGroup>

              <FieldGroup title="Renda e horizonte">
                <ChoiceGrid
                  value={normalizedDraft.monthlyIncomeRange}
                  options={[
                    { v: 'ate_5k', label: 'Ate 5k' },
                    { v: '5k-10k', label: '5k a 10k' },
                    { v: '10k-15k', label: '10k a 15k' },
                    { v: '15k+', label: '15k+' }
                  ]}
                  onChange={(v) => setDraft((c) => ({ ...c, monthlyIncomeRange: v }))}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <NumberField
                    label="Aporte mensal (meta)"
                    value={normalizedDraft.monthlyInvestmentTarget}
                    onChange={(n) => setDraft((c) => ({ ...c, monthlyInvestmentTarget: n }))}
                  />
                  <NumberField
                    label="Disponivel agora"
                    value={normalizedDraft.availableToInvest}
                    onChange={(n) => setDraft((c) => ({ ...c, availableToInvest: n }))}
                  />
                </div>

                <ChoiceGrid
                  value={normalizedDraft.investmentHorizon}
                  options={[
                    { v: 'curto_prazo', label: 'Curto (0-2a)' },
                    { v: 'medio_prazo', label: 'Medio (2-5a)' },
                    { v: 'longo_prazo', label: 'Longo (5+a)' }
                  ]}
                  onChange={(v) => setDraft((c) => ({ ...c, investmentHorizon: v }))}
                />
              </FieldGroup>

              <FieldGroup title="Plataformas">
                <PlatformsEditor value={normalizedDraft.platformsUsed} onChange={(v) => setDraft((c) => ({ ...c, platformsUsed: v }))} />
              </FieldGroup>

              <FieldGroup title="Preferencias">
                <ToggleRow
                  label="Ghost mode (ocultar valores)"
                  checked={Boolean(normalizedDraft.displayPreferences?.ghostMode)}
                  onChange={(checked) => setDraft((c) => ({ ...c, displayPreferences: { ghostMode: checked } }))}
                />
              </FieldGroup>
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btnPrimary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="btn btnGhost" onClick={() => props.onGoToTarget('/home')}>Voltar</button>
            </div>
          </section>
        </div>
      )}
    </ShellLayout>
  );
}

function FieldGroup(props: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontWeight: 900 }}>{props.title}</div>
      {props.children}
    </div>
  );
}

function ChoiceGrid(props: { value: string | null; options: Array<{ v: string; label: string }>; onChange(v: string): void }): JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
      {props.options.map((o) => (
        <button
          key={o.v}
          type="button"
          className="btn btnGhost"
          onClick={() => props.onChange(o.v)}
          style={{
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 14,
            borderColor: props.value === o.v ? 'rgba(245,106,42,0.55)' : 'rgba(11,18,24,0.14)',
            background: props.value === o.v ? 'rgba(245,106,42,0.10)' : 'rgba(255,255,255,0.72)'
          }}
        >
          <div style={{ fontWeight: 900 }}>{o.label}</div>
        </button>
      ))}
    </div>
  );
}

function NumberField(props: { label: string; value: number | null; onChange(n: number | null): void }): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--c-slate)', fontWeight: 800 }}>{props.label}</span>
      <input
        className="input"
        inputMode="numeric"
        value={props.value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (!raw) return props.onChange(null);
          const n = Number(raw.replace(',', '.'));
          props.onChange(Number.isFinite(n) ? n : null);
        }}
        placeholder="0"
      />
    </label>
  );
}

function ToggleRow(props: { label: string; checked: boolean; onChange(v: boolean): void }): JSX.Element {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(11,18,24,0.10)', background: 'rgba(255,255,255,0.7)' }}>
      <span style={{ fontWeight: 800 }}>{props.label}</span>
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
    </label>
  );
}

function PlatformsEditor(props: { value: ProfilePlatformsUsed | null; onChange(v: ProfilePlatformsUsed): void }): JSX.Element {
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
        <button
          key={it.id}
          type="button"
          className="btn btnGhost"
          onClick={() => toggle(it.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 14,
            borderColor: current.platformIds.includes(it.id) ? 'rgba(245,106,42,0.55)' : 'rgba(11,18,24,0.14)',
            background: current.platformIds.includes(it.id) ? 'rgba(245,106,42,0.10)' : 'rgba(255,255,255,0.72)'
          }}
        >
          <div style={{ fontWeight: 900 }}>{it.label}</div>
        </button>
      ))}
      <div style={{ fontSize: 12, color: 'var(--c-slate)' }}>
        Isso ajuda a sugerir o caminho mais simples de importacao.
      </div>
    </div>
  );
}

function normalizeContextForUi(input: ProfileContextPayload): ProfileContextPayload {
  return {
    ...input,
    financialGoal: normalizeEmptyToNull(input.financialGoal),
    monthlyIncomeRange: normalizeEmptyToNull(input.monthlyIncomeRange),
    riskProfileSelfDeclared: normalizeEmptyToNull(input.riskProfileSelfDeclared),
    riskProfileQuizResult: normalizeEmptyToNull(input.riskProfileQuizResult),
    riskProfileEffective: normalizeEmptyToNull(input.riskProfileEffective),
    investmentHorizon: normalizeEmptyToNull(input.investmentHorizon)
  };
}

function normalizeContextForApi(input: ProfileContextPayload): ProfileContextPayload {
  // Backend aceita string vazia e trata como "nao sobrescreve"; aqui mantemos null como null.
  // Evita mandar undefined.
  return { ...input };
}

function normalizeEmptyToNull(v: string | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

