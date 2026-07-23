import React, { useMemo, useState } from 'react';
import type { AppDataSources } from '../../core/data/data_sources';
import { ShellLayout } from '../../app/ShellLayout';
import { createImportsController } from './imports_controller';

export interface ImportsEntryScreenProps {
  dataSources: AppDataSources;
  onGoToTarget(path: string): void;
}

type ImportMode = 'b3_csv' | 'custom_template' | 'document' | 'manual';

export function ImportsEntryScreen(props: ImportsEntryScreenProps): JSX.Element {
  const controller = useMemo(() => createImportsController({ imports: props.dataSources.imports }), [props.dataSources]);
  const [mode, setMode] = useState<ImportMode>('b3_csv');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      // Backend usa `origin` para escolher o pipeline; aqui so declaramos intencao (sem upload ainda).
      const origin =
        mode === 'b3_csv' ? 'B3_CSV'
          : mode === 'custom_template' ? 'CUSTOM_TEMPLATE'
            : mode === 'document' ? 'DOCUMENT_AI_PARSE'
              : 'MANUAL_ENTRY';
      const res = await controller.start({ origin });
      if (!res.envelope.ok) {
        setError(`${res.envelope.error.code}: ${res.envelope.error.message}`);
        setBusy(false);
        return;
      }
      props.onGoToTarget(res.nextPathname ?? `/imports/${encodeURIComponent(res.envelope.data.importId)}/preview`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao iniciar');
      setBusy(false);
    }
  }

  return (
    <ShellLayout title="Nova importacao" activeRouteId="imports" onNavigate={(href) => props.onGoToTarget(href)}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Escolha o caminho mais simples</div>
        <div style={{ color: 'var(--c-slate)', lineHeight: 1.55 }}>
          Sem burocracia: voce inicia, revisa no preview e so depois confirma. Nada entra na carteira sem revisao.
        </div>

        {error ? (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: 'rgba(232,92,92,0.10)', border: '1px solid rgba(232,92,92,0.25)' }}>
            <div style={{ fontWeight: 900, marginBottom: 4 }}>Nao foi possivel iniciar</div>
            <div style={{ color: 'var(--c-slate)' }}>{error}</div>
          </div>
        ) : null}

        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <ChoiceRow label="CSV da B3" hint="Caminho mais comum para quem investe em bolsa." selected={mode === 'b3_csv'} onClick={() => setMode('b3_csv')} />
          <ChoiceRow label="Template proprio" hint="Para planilhas padronizadas (ex: corretora/controle pessoal)." selected={mode === 'custom_template'} onClick={() => setMode('custom_template')} />
          <ChoiceRow label="Documento (PDF)" hint="Quando voce so tem um extrato/nota e precisa de ajuda." selected={mode === 'document'} onClick={() => setMode('document')} />
          <ChoiceRow label="Entrada manual" hint="Quando importacao nao resolve ou voce quer ajustar aos poucos." selected={mode === 'manual'} onClick={() => setMode('manual')} />
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btnPrimary" onClick={() => void start()} disabled={busy}>
            {busy ? 'Iniciando...' : 'Continuar para preview'}
          </button>
          <button className="btn btnGhost" onClick={() => props.onGoToTarget('/imports')}>
            Ver historico
          </button>
        </div>
      </div>
    </ShellLayout>
  );
}

function ChoiceRow(props: { label: string; hint: string; selected: boolean; onClick(): void }): JSX.Element {
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
      <div style={{ fontSize: 12, color: 'var(--c-slate)', marginTop: 4 }}>{props.hint}</div>
    </button>
  );
}
