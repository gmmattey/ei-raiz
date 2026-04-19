import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { ChevronUp, Loader2 } from 'lucide-react';
import { carteiraApi, getStoredUser, insightsApi } from '../../cliente-api';

const PreInsight: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    userName: '',
    patrimonio: 'R$ 0,00',
    percentualJornada: '0%',
    acaoRecomendada: 'Analisando sua carteira...'
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const user = getStoredUser();
        const [resumo, insights] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          insightsApi.obterResumo()
        ]);

        const moeda = (valor: number) =>
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

        setData({
          userName: user?.nome?.split(' ')[0] || 'Investidor',
          patrimonio: moeda(resumo.patrimonioLiquido ?? 0),
          percentualJornada: resumo.quantidadeAtivos > 0 ? 'em evolução' : '0%',
          acaoRecomendada:
            insights.diagnosticoFinal?.oQueFazerAgora ||
            insights.insightPrincipal?.acao ||
            insights.diagnosticoFinal?.insightPrincipal?.acao ||
            insights.insightPrincipal?.descricao ||
            insights.diagnosticoFinal?.insightPrincipal?.descricao ||
            insights.riscoPrincipal?.descricao ||
            insights.acaoPrioritaria?.descricao ||
            'Sua carteira está sendo processada.'
        });
      } catch (err) {
        console.error('Falha ao carregar PreInsight:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleContinue = () => {
    localStorage.setItem('hasSeenPreInsight', 'true');
    navigate('/home', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1218] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#f56a2a]" size={32} />
      </div>
    );
  }

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
                Oi, {data.userName}. <br />
                Seus investimentos <span className="text-[#f56a2a]">tão fazendo sentido</span>.
              </h1>
              <div className="max-w-xl text-lg font-light leading-relaxed text-white/50">
                Você já juntou <span className="font-bold text-white">{data.patrimonio}</span>. {data.percentualJornada !== '0%' && (
                  <>Sua carteira está <span className="font-bold text-[#6FCF97]">{data.percentualJornada}</span>.</>
                )}
              </div>
            </div>

            {/* Card de Ação Recomendada */}
            <div className="pt-12 md:col-span-4 md:pt-32 fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-5 p-6 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f56a2a]">
                  <img
                    src={assetPath('/assets/icons/original/aporte.svg')}
                    alt="Ação"
                    className="h-5 w-5"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-widest text-white">Próximo passo</h3>
                  <p className="text-xs italic leading-relaxed text-white/40">
                    "{data.acaoRecomendada}"
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
