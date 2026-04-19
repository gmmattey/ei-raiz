import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SimuladorMobileLayout({ title, children }) {
  const navigate = useNavigate();
  return (
    <section className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/decisoes')}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
        >
          <ArrowLeft size={14} />
        </button>
        <h1 className="font-['Sora'] text-[18px] font-bold leading-tight text-[var(--text-primary)]">{title}</h1>
      </div>
      {children}
    </section>
  );
}
