import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ConfiguracoesMobile() {
  const { isDarkMode, toggleTheme } = useTheme();
  const rows = ['Notificacoes', 'Alterar senha', 'Privacidade', 'Termos de uso'];

  return (
    <section className="space-y-4 pb-4">
      <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Configuracoes</h1>
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)]">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between border-b border-[var(--border-color)] px-4 py-3 text-left"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">Tema</span>
          <span className="text-xs font-bold text-[#F56A2A]">{isDarkMode ? 'Dark' : 'Claro'}</span>
        </button>
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3 last:border-b-0">
            <span className="text-sm font-medium text-[var(--text-primary)]">{row}</span>
            <span className="text-xs font-bold text-[#F56A2A]">Abrir</span>
          </div>
        ))}
      </article>
    </section>
  );
}
