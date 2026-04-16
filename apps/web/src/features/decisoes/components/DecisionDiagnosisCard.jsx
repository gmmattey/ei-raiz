import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const DecisionDiagnosisCard = ({ recommendation, reason, alert, action, scoreImpact, financialImpact, risk, onClickAction }) => {
  return (
    <div className="group w-full rounded-xl border border-[#0B1218] bg-[#0B1218] p-1 text-left transition-all hover:border-[#F56A2A]">
      <div className="flex flex-col items-start gap-6 border border-white/10 bg-white/5 p-8 md:flex-row md:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F56A2A]/10 text-[#F56A2A]">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">
              Recomendação do Esquilo
            </span>
          </div>
          <h3 className="font-['Sora'] text-xl font-bold text-white leading-snug">
            {recommendation}
          </h3>
          <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-2xl">
            {reason}
          </p>
          {(scoreImpact || financialImpact || risk) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] uppercase tracking-widest">
              <div className="border border-white/10 px-2 py-2 text-white/70">Impacto no Score: <span className="text-white">{scoreImpact || "n/d"}</span></div>
              <div className="border border-white/10 px-2 py-2 text-white/70">Impacto Financeiro: <span className="text-white">{financialImpact || "n/d"}</span></div>
              <div className="border border-white/10 px-2 py-2 text-white/70">Risco Associado: <span className="text-white">{risk || "n/d"}</span></div>
            </div>
          )}
          {alert && (
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#E85C5C]">
              <span className="h-1 w-1 rounded-full bg-[#E85C5C]" />
              Atenção: {alert}
            </div>
          )}
        </div>
        {action && (
          <button 
            onClick={onClickAction}
            className="flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F56A2A] transition-transform group-hover:translate-x-1"
          >
            {action} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DecisionDiagnosisCard;
