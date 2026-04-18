import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DecisionSimulatorLayout = ({ title, subtitle, children, onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[1024px] font-['Inter'] text-[#0B1218]">
      <div className="mb-12 flex flex-col items-start gap-4">
        <button
          onClick={onBack || (() => navigate('/decisoes'))}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40 hover:text-[#F56A2A] transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para Decisões
        </button>
        <div>
          <h1 className="font-['Sora'] text-3xl font-bold tracking-tight text-[#0B1218] md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[#0B1218]/60 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-12 fade-in-up">
        {children}
      </div>
    </div>
  );
};

export default DecisionSimulatorLayout;
