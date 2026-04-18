import React from 'react';

const OPTIONS = ['Conservador', 'Moderado', 'Arrojado'];

export default function PerfilRiscoMobile() {
  return (
    <section className="space-y-4 pb-4">
      <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Perfil de risco</h1>
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-sm text-[var(--text-secondary)]">Selecione seu perfil atual:</p>
        <div className="mt-3 space-y-2">
          {OPTIONS.map((opt) => (
            <button key={opt} className="w-full rounded-[12px] border border-[var(--border-color)] px-3 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">
              {opt}
            </button>
          ))}
        </div>
        <button className="mt-4 h-11 w-full rounded-[12px] bg-[#F56A2A] text-[11px] font-bold uppercase tracking-[0.12em] text-white">Salvar perfil</button>
      </article>
    </section>
  );
}

