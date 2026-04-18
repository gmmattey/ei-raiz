import React from 'react';

export default function ImportarMobile() {
  return (
    <section className="space-y-4 pb-4">
      <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Importar dados</h1>
      <article className="rounded-[16px] border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Toque para selecionar planilha</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Excel (.xlsx) ou CSV</p>
        <button className="mt-4 h-11 w-full rounded-[12px] bg-[#F56A2A] text-[11px] font-bold uppercase tracking-[0.12em] text-white">Selecionar arquivo</button>
      </article>
    </section>
  );
}

