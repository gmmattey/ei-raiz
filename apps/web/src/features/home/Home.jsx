import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Plus, TrendingUp, AlertCircle, LayoutDashboard, Wallet, History, FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { ApiError, carteiraApi, insightsApi, getStoredUser } from '../../cliente-api';
import { useConteudoApp } from '../../hooks/useConteudoApp';

export default function HomeLobby() {
  const { texto } = useConteudoApp();
  const [showValues, setShowValues] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(null);
  const [insights, setInsights] = useState(null);
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const navigate = useNavigate();

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setUsuario(getStoredUser());
        
        const [dadosCarteira, dadosInsights] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          insightsApi.obterResumo()
        ]);

        if (ativo) {
          setResumo(dadosCarteira);
          setInsights(dadosInsights);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setError('Falha ao carregar dados da Home.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [navigate]);

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const moeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

  const quickActions = [
    { title: 'Sua Carteira', desc: 'Ativos e alocação', icon: <Wallet size={20} />, action: () => navigate('/carteira?categoria=acao') },
    { title: 'Insights', desc: 'Diagnóstico tático', icon: <LayoutDashboard size={20} />, action: () => navigate('/insights') },
    { title: 'Decisões', desc: 'Simulador estratégico', icon: <TrendingUp size={20} />, action: () => navigate('/decisoes') },
    { title: 'Histórico', desc: 'Evolução e eventos', icon: <History size={20} />, action: () => navigate('/historico') },
    { title: 'Importar', desc: 'Sincronizar dados', icon: <FileUp size={20} />, action: () => navigate('/importar') },
  ];

  const possuiDadosReais = (resumo?.quantidadeAtivos ?? 0) > 0 && (resumo?.patrimonioTotal ?? 0) > 0;
  const insightPrioritario = insights?.riscoPrincipal || insights?.acaoPrioritaria;

  if (loading) {
    return (
      <div className="w-full max-w-[896px] animate-pulse">
        <div className="mb-12">
          <div className="h-4 w-24 bg-[#EFE7DC] mb-2 rounded" />
          <div className="h-10 w-48 bg-[#EFE7DC] mb-8 rounded" />
          <div className="h-64 bg-[#EFE7DC] rounded-sm" />
        </div>
        <div className="h-32 bg-[#EFE7DC] mb-12 rounded-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#EFE7DC] rounded-sm" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FDFCFB] font-['Inter'] text-[#0B1218] selection:bg-[#F56A2A] selection:text-white">
      <div className="w-full max-w-[896px]">
        {/* Header / Saudação */}
        <section className="mb-12 fade-in-up">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">
            {getSaudacao()},
          </p>
          <h1 className="mb-8 font-['Sora'] text-3xl font-bold tracking-tight text-[#0B1218] md:text-4xl">
            {usuario?.nome || 'investidor(a)'}.
          </h1>

          {/* Card Principal de Patrimônio */}
          <div className="rounded-sm border border-[#EFE7DC] bg-white p-8 shadow-sm transition-all hover:shadow-md md:p-10 fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">{texto("home.cartao_principal.titulo", "Patrimônio Total")}</p>
                  <button
                    onClick={() => setShowValues(!showValues)}
                    className="text-[#0B1218]/20 transition-colors hover:text-[#0B1218]"
                  >
                    {showValues ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                
                <h2 className="font-['Sora'] text-4xl font-bold md:text-5xl">
                  {showValues ? moeda(resumo?.patrimonioTotal) : '••••••••'}
                </h2>

                {possuiDadosReais && (
                  <div className="mt-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className={resumo?.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"} />
                      <span className={`text-xs font-bold ${resumo?.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>
                        Retorno consolidado: {resumo?.retorno12m?.toFixed?.(2) ?? '0.00'}%
                      </span>
                    </div>
                    {(insights?.diagnosticoFinal?.mensagem || insights?.diagnostico?.resumo) && (
                      <p className="text-[11px] font-medium leading-relaxed text-[#0B1218]/60 max-w-md">
                        {insights?.diagnosticoFinal?.mensagem || insights?.diagnostico?.resumo}
                      </p>
                    )}
                    {insights?.impactoDecisoesRecentes?.quantidade > 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45">
                        Decisões recentes: {insights.impactoDecisoesRecentes.deltaTotal >= 0 ? '+' : ''}{insights.impactoDecisoesRecentes.deltaTotal.toFixed(1)} pts no score ({insights.impactoDecisoesRecentes.quantidade} simulações)
                      </p>
                    )}
                  </div>
                )}

                {!possuiDadosReais && !error && (
                  <div className="mt-6">
                    <p className="text-xs text-[#0B1218]/60 leading-relaxed mb-4">
                      {texto("home.cartao_principal.sem_base", "Sua carteira ainda está vazia. Importe seu primeiro extrato para liberar a análise completa de patrimônio, riscos e insights.")}
                    </p>
                    <button
                      onClick={() => navigate('/importar')}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F56A2A] hover:gap-3 transition-all"
                    >
                      Começar importação <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {error && <p className="mt-4 text-xs text-[#E85C5C] font-medium">{error}</p>}
              </div>

              <div className="hidden h-32 w-px bg-[#EFE7DC] md:block" />

              <div className="flex shrink-0 gap-4 border-t border-[#EFE7DC] pt-8 md:border-0 md:pt-0">
              <button
                onClick={() => navigate('/carteira?categoria=acao')}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#0B1218] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#111923] md:w-auto"
              >
                <Plus size={16} /> Gerir ações
              </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco de Insight Prioritário */}
        {possuiDadosReais && insightPrioritario && (
          <section className="mb-12 fade-in-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => navigate('/insights')}
              className="group w-full cursor-pointer rounded-sm border border-[#0B1218] bg-[#0B1218] p-1 text-left transition-all hover:border-[#F56A2A]"
            >
              <div className="flex flex-col items-start gap-6 border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#F56A2A]/10 text-[#F56A2A]">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">
                      {insights?.riscoPrincipal ? 'Insight Prioritário' : 'Ação Recomendada'}
                    </span>
                  </div>
                  <h3 className="font-['Sora'] text-lg font-bold text-white leading-snug">
                    {insightPrioritario.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-white/50 leading-relaxed">
                    {insightPrioritario.descricao}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F56A2A] transition-transform group-hover:translate-x-1">
                  Ver Análise <ArrowRight size={16} />
                </div>
              </div>
            </button>
          </section>
        )}

        {/* Acesso Rápido */}
        <section className="fade-in-up" style={{ animationDelay: '0.15s' }}>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">{texto("home.quick_actions.titulo", "Acesso Rápido")}</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {quickActions.map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="group flex flex-col items-start gap-4 rounded-sm border border-[#0B1218] bg-[#0B1218] p-6 text-left transition-all hover:border-[#F56A2A] hover:shadow-lg"
              >
                <div className="text-white/20 transition-colors group-hover:text-[#F56A2A]">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-['Sora'] text-sm font-bold text-white">{item.title}</h4>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/40 leading-tight">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
