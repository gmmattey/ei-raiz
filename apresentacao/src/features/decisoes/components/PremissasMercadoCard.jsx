import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function PremissasMercadoCard({ premissas = [], className = '' }) {
  if (!premissas.length) return null;
  return (
    <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-[var(--text-secondary)]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Parâmetros de mercado utilizados</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {premissas.map((p) => (
          <div key={p.chave} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{p.label}</span>
            <span className="text-[11px] text-[var(--text-primary)]">{p.valorFormatado}</span>
            {p.fonte && <span className="text-[10px] text-[var(--text-muted)] opacity-70">{p.fonte}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
