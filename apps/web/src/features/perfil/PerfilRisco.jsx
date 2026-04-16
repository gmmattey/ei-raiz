import React, { useState } from 'react';
import { 
  Target, ArrowRight, ShieldCheck, 
  RefreshCcw, Info, X, PieChart,
  ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';

// --- Componentes Base ---

const ExplainerTooltip = ({ title, content, onClose }) => (
  <div className="absolute z-[100] mt-2 w-72 bg-white border border-[#EFE7DC] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-['Sora'] text-xs font-bold text-[#0B1218] uppercase tracking-tight">{title}</h4>
      <button onClick={onClose} className="text-[#0B1218]/20 hover:text-[#E85C5C] transition-colors cursor-pointer">
        <X size={14} />
      </button>
    </div>
    <p className="text-[12px] leading-relaxed text-[#0B1218]/60 font-medium">{content}</p>
  </div>
);

const InfoTrigger = ({ title, text }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 text-[#0B1218]/10 hover:text-[#f56a2a] transition-colors cursor-pointer"
      >
        <Info size={14} />
      </button>
      {isOpen && <ExplainerTooltip title={title} content={text} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

const AllocationBar = ({ label, current, target, color }) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]">{label}</span>
      <span className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Alvo: {target}%</span>
    </div>
    <div className="h-4 w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-full overflow-hidden relative">
      <div 
        className={`h-full ${color} transition-all duration-1000`} 
        style={{ width: `${current}%` }}
      ></div>
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-[#0B1218] opacity-30" 
        style={{ left: `${target}%` }}
      ></div>
    </div>
    <div className="flex justify-between mt-1">
      <span className="text-[9px] font-bold text-[#0B1218]/30">Atual: {current}%</span>
      <span className={`text-[9px] font-bold ${Math.abs(current - target) > 5 ? 'text-[#E85C5C]' : 'text-[#6FCF97]'}`}>
        {current > target ? `+${(current - target).toFixed(1)}%` : `${(current - target).toFixed(1)}%`}
      </span>
    </div>
  </div>
);

export default function PerfilRisco() {
  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-20 items-start">
          
          {/* Perfil Atual */}
          <aside className="space-y-12">
            <div>
              <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
                <ShieldCheck size={20} />
                <span className="text-xs font-bold uppercase tracking-[0.3em]">Suitability Ativo</span>
              </div>
              <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-4">Esquilo Moderado</h1>
              <p className="text-[#0B1218]/40 text-sm font-medium leading-relaxed mb-8">
                Seu perfil busca o equilíbrio entre proteção de poder de compra e crescimento real de longo prazo.
              </p>
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40 hover:text-[#F56A2A] transition-all">
                <RefreshCcw size={14} /> Refazer Teste de Perfil
              </button>
            </div>

            <div className="bg-[#0B1218] p-8 text-white rounded-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Diagnóstico de Desvio</h4>
              <p className="text-xs leading-relaxed mb-8">
                Sua carteira hoje está <span className="text-[#E85C5C] font-bold">12.4% desalinhada</span> com o perfil moderado. Isso significa que você está correndo mais risco do que deveria.
              </p>
              <button className="w-full bg-[#F56A2A] py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#d95a20] transition-all">
                Ver Sugestão de Ajuste
              </button>
            </div>
          </aside>

          {/* Comparativo de Alocação */}
          <section className="bg-white border border-[#EFE7DC] rounded-xl overflow-hidden">
            <div className="p-8 border-b border-[#EFE7DC] flex justify-between items-center bg-[#FAFAFA]">
              <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-widest text-[#0B1218]">Alocação Alvo vs Atual</h3>
              <InfoTrigger title="Cálculo de Reequilibrio" text="O Alvo é definido pela nossa inteligência com base no seu perfil. O Atual é lido diretamente das suas notas de corretagem." />
            </div>

            <div className="p-10">
              <AllocationBar label="Renda Fixa Pós-Fixada" current={30} target={40} color="bg-[#EFE7DC]" />
              <AllocationBar label="Renda Fixa IPCA+" current={15} target={20} color="bg-[#0B1218]/10" />
              <AllocationBar label="Ações Brasil" current={35} target={25} color="bg-[#F56A2A]" />
              <AllocationBar label="Internacional" current={20} target={15} color="bg-[#0B1218]" />
            </div>

            <div className="p-8 bg-[#FAFAFA] border-t border-[#EFE7DC]">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-[#E85C5C] shrink-0" size={20} />
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] mb-1">Atenção Necessária</h5>
                  <p className="text-xs text-[#0B1218]/60 leading-relaxed font-medium">
                    O excesso em <span className="font-bold">Ações Brasil</span> aumenta a volatilidade da sua carteira. Recomendamos que os próximos aportes sejam direcionados exclusivamente para Renda Fixa até atingir o equilíbrio.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
