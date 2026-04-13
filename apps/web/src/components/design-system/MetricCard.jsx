import React from "react";
import { useModoVisualizacao } from "../../context/ModoVisualizacaoContext";

export default function MetricCard({ label, value, badge, subtitle }) {
  const { ocultarValores } = useModoVisualizacao();

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-sm transition-colors duration-300">
      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest block mb-4">{label}</span>
      <div className="flex items-baseline gap-2 flex-wrap">
        <h3 className="font-['Sora'] text-2xl font-bold text-[var(--text-primary)]">{ocultarValores ? '••••••••' : value}</h3>
        {badge && (
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">{subtitle}</p>
      )}
    </div>
  );
}
