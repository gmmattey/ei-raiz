import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DecisionScenarioMobile({ title }) {
  const navigate = useNavigate();
  return (
    <section className="space-y-4 pb-4">
      <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">{title}</h1>
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-3">
        <input className="w-full rounded-[12px] border border-[var(--border-color)] px-3 py-3 text-sm bg-[var(--bg-card)]" placeholder="Valor principal (R$)" />
        <input className="w-full rounded-[12px] border border-[var(--border-color)] px-3 py-3 text-sm bg-[var(--bg-card)]" placeholder="Prazo (meses)" />
        <button onClick={() => navigate('/decisoes/resultado/novo')} className="h-11 w-full rounded-[12px] bg-[#F56A2A] text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Simular agora
        </button>
      </article>
    </section>
  );
}

