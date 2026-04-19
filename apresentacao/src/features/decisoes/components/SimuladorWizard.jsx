import React from 'react';
import { ChevronLeft, ChevronRight, Check, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SimuladorWizard({ title, steps, currentStep, onNext, onPrev, onCalcular, loading, children }) {
  const navigate = useNavigate();
  const totalSteps = steps.length;
  const isLast = currentStep === totalSteps - 1;

  return (
    <section className="flex min-h-[calc(100dvh-120px)] flex-col pb-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={currentStep === 0 ? () => navigate('/decisoes') : onPrev}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
        >
          <ChevronLeft size={14} />
        </button>
        <h1 className="font-['Sora'] text-[17px] font-bold leading-tight text-[var(--text-primary)]">{title}</h1>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-start gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-1 flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300 ${
                i < currentStep
                  ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                  : i === currentStep
                  ? 'border-[#F56A2A] bg-[#F56A2A]/10 text-[#F56A2A]'
                  : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}>
                {i < currentStep ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`mt-1.5 text-center text-[9px] font-semibold uppercase tracking-wide leading-tight w-full ${
                i === currentStep ? 'text-[#F56A2A]' : i < currentStep ? 'text-[#10B981]' : 'text-[var(--text-secondary)]'
              }`}>
                {step.label}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className="relative mt-[15px] h-[2px] flex-1 bg-[var(--border-color)]">
                <div className={`absolute inset-y-0 left-0 bg-[#F56A2A] transition-all duration-500 ${i < currentStep ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step label */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F56A2A]">
          Etapa {currentStep + 1} de {totalSteps}
        </p>
        <h2 className="font-['Sora'] text-[20px] font-bold text-[var(--text-primary)]">
          {steps[currentStep]?.title}
        </h2>
        {steps[currentStep]?.desc && (
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{steps[currentStep].desc}</p>
        )}
      </div>

      {/* Conteúdo do step */}
      <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
        {children}
      </div>

      {/* Navegação */}
      <div className="mt-6 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
        <button
          onClick={currentStep === 0 ? () => navigate('/decisoes') : onPrev}
          className="flex items-center gap-1 text-[12px] font-semibold text-[var(--text-secondary)] active:opacity-60"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        {isLast ? (
          <button
            onClick={onCalcular}
            disabled={loading}
            className="flex items-center gap-2 rounded-[14px] bg-[#F56A2A] px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
          >
            <Calculator size={14} /> {loading ? 'Calculando...' : 'Calcular'}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1 rounded-[14px] bg-[var(--text-primary)] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--bg-primary)] active:opacity-80"
          >
            Próximo <ChevronRight size={14} />
          </button>
        )}
      </div>
    </section>
  );
}
