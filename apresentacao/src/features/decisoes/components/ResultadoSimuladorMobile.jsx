import React from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';

export default function ResultadoSimuladorMobile({ resultado, onRecalcular, loading, recalcularLabel = 'Recalcular', premissasMercado = [] }) {
  const delta = resultado.impactoScore?.delta ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Resultado</p>

      {resultado.cenarioA?.length > 0 && (
        <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Cenário A</p>
          {resultado.cenarioA.map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 last:border-0 last:pb-0">
              <span className="text-[12px] text-[var(--text-secondary)]">{item.label}</span>
              <span className="text-[12px] font-bold text-[var(--text-primary)]">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {resultado.cenarioB?.length > 0 && (
        <div className="rounded-[14px] border border-[#F56A2A]/40 bg-[#F56A2A]/5 p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F56A2A]">Cenário B</p>
          {resultado.cenarioB.map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-[#F56A2A]/20 pb-2 last:border-0 last:pb-0">
              <span className="text-[12px] text-[var(--text-secondary)]">{item.label}</span>
              <span className="text-[12px] font-bold text-[var(--text-primary)]">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {resultado.diagnostico?.titulo && (
        <div className="rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">Diagnóstico</p>
          <p className="font-['Sora'] text-[14px] font-bold text-[var(--text-primary)]">{resultado.diagnostico.titulo}</p>
          {resultado.diagnostico.descricao && (
            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">{resultado.diagnostico.descricao}</p>
          )}
          {resultado.diagnostico.acao && (
            <p className="text-[12px] font-semibold text-[#F56A2A]">{resultado.diagnostico.acao}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-center">
          <p className="text-[10px] text-[var(--text-secondary)]">Score atual</p>
          <p className="mt-1 font-bold text-[var(--text-primary)]">{resultado.impactoScore?.scoreAtual ?? '—'}</p>
        </div>
        <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-center">
          <p className="text-[10px] text-[var(--text-secondary)]">Projetado</p>
          <p className="mt-1 font-bold text-[var(--text-primary)]">{resultado.impactoScore?.scoreProjetado ?? '—'}</p>
        </div>
        <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-center">
          <p className="text-[10px] text-[var(--text-secondary)]">Delta</p>
          <p className={`mt-1 font-bold ${delta >= 0 ? 'text-[#10B981]' : 'text-[#E85C5C]'}`}>
            {delta >= 0 ? '+' : ''}{delta}
          </p>
        </div>
      </div>

      {premissasMercado.length > 0 && (
        <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-[var(--text-secondary)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Parâmetros de mercado utilizados</p>
          </div>
          {premissasMercado.map((p) => (
            <div key={p.chave} className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5 last:border-0 last:pb-0">
              <span className="text-[11px] text-[var(--text-secondary)]">{p.label}</span>
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">{p.valorFormatado}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onRecalcular}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)] disabled:opacity-50"
      >
        <RefreshCw size={14} /> {recalcularLabel}
      </button>
    </div>
  );
}
