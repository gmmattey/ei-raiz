import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { ChevronUp } from 'lucide-react';

interface PreInsightProps {
  userName?: string;
  patrimonio?: string;
  percentualJornada?: string;
  acaoRecomendada?: string;
}

const PreInsight: React.FC<PreInsightProps> = ({
  userName = 'Luiz Giammattey',
  patrimonio = 'R$ 142.530,22',
  percentualJornada = '15%',
  acaoRecomendada = 'Sugerimos realizar lucros em ativos de risco e reforçar a posição em pós-fixados.',
}) => {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [startY, setStartY] = useState(0);

  const handleContinue = () => {
    localStorage.setItem('hasSeenPreInsight', 'true');
    navigate('/home', { replace: true });
  };

  const handleStart = (y: number) => setStartY(y);
  const handleMove = (y: number) => {
    if (startY === 0) return;
    const diff = y - startY;
    if (diff < 0) setOffset(diff);
  };
  const handleEnd = () => {
    if (offset < -100) handleContinue();
    setOffset(0);
    setStartY(0);
  };

  return (
    <div className="min-h-screen bg-[#0B1218] p-6 text-white overflow-y-auto selection:bg-[#f56a2a]">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-3rem)] w-full max-w-[896px] flex-col justify-center border-l border-white/5 pl-8 md:pl-12">
          {/* Logo */}
          <div className="mb-20 cursor-pointer fade-in-up" onClick={handleContinue}>
            <img
              src={assetPath('/assets/logo/logo-horizontal-fundo-escuro-invest-laranja.svg')}
              alt="Esquilo Invest"
              className="h-[40px] opacity-40 hover:opacity-100 transition-all"
            />
          </div>

          <div className="mb-24 grid grid-cols-1 items-start gap-12 md:grid-cols-12">
            {/* Conteúdo Principal */}
            <div className="md:col-span-8 fade-in-up" style={{ animationDelay: '0.1s' }}>
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.4em] text-[#f56a2a]">Seu primeiro diagnóstico</p>
              <h1 className="mb-8 font-['Sora'] text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
                Oi, {userName}. <br />
                Seus investimentos <span className="text-[#f56a2a]">tão fazendo sentido</span>.
              </h1>
              <div className="max-w-xl text-lg font-light leading-relaxed text-white/50">
                Você já juntou <span className="font-bold text-white">{patrimonio}</span>. Com a meta de liberdade financeira que você falou, você já avançou <span className="font-bold text-[#6FCF97]">{percentualJornada}</span>.
              </div>
            </div>

            {/* Card de Ação Recomendada */}
            <div className="pt-12 md:col-span-4 md:pt-32 fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-5 p-6 rounded-sm border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f56a2a]">
                  <img
                    src={assetPath('/assets/icons/original/aporte.svg')}
                    alt="Ação"
                    className="h-5 w-5"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-widest text-white">Próximo passo</h3>
                  <p className="text-xs italic leading-relaxed text-white/40">
                    "{acaoRecomendada}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button 
            onClick={handleContinue} 
            className="group flex cursor-pointer flex-col items-start gap-4 fade-in-up transition-all hover:translate-x-1" 
            style={{ animationDelay: '0.3s' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40 transition-colors group-hover:text-[#f56a2a]">Entrar no Dashboard</p>
            <ChevronUp size={20} className="text-[#f56a2a] opacity-20 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreInsight;
