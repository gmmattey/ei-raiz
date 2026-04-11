import React, { useEffect, useMemo, useState } from 'react';
import { 
  Zap, Target,
  ArrowRight, CheckCircle2, AlertTriangle,
  Info, X, Microscope
} from 'lucide-react';
import { ApiError, insightsApi } from '../../cliente-api';
import { useNavigate } from 'react-router-dom';

// --- Componentes Base (Padrão Esquilo) ---

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

const InsightCard = ({ type, title, description, impact, action, infoTitle, infoText }) => {
  const themes = {
    alert: { icon: <AlertTriangle size={20} />, color: 'text-[#E85C5C]', bg: 'bg-[#E85C5C]/5', border: 'border-[#E85C5C]/20' },
    positive: { icon: <CheckCircle2 size={20} />, color: 'text-[#6FCF97]', bg: 'bg-[#6FCF97]/5', border: 'border-[#6FCF97]/20' },
    opportunity: { icon: <Zap size={20} />, color: 'text-[#F56A2A]', bg: 'bg-[#F56A2A]/5', border: 'border-[#F56A2A]/20' }
  };
  const theme = themes[type];

  return (
    <div className={`p-8 border-l-4 ${theme.border} ${theme.bg} mb-6 transition-all hover:shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-3 ${theme.color}`}>
          {theme.icon}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{type === 'alert' ? 'Ponto de Atenção' : type === 'positive' ? 'Consistência' : 'Oportunidade'}</span>
        </div>
        <InfoTrigger title={infoTitle} text={infoText} />
      </div>
      <h3 className="font-['Sora'] text-xl font-bold text-[#0B1218] mb-3">{title}</h3>
      <p className="text-sm text-[#0B1218]/60 leading-relaxed mb-6 max-w-2xl">{description}</p>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#0B1218]/5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">
          Impacto Estimado: <span className="text-[#0B1218]">{impact}</span>
        </div>
        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F56A2A] hover:gap-3 transition-all">
          {action} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default function Insights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const dados = await insightsApi.obterResumo();
        if (!ativo) return;
        setResumo(dados);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setError('Falha ao carregar insights.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const cards = useMemo(() => {
    if (!resumo) return [];
    const lista = [];
    
    // 1. Risco Principal (Backend-driven)
    if (resumo.riscoPrincipal) {
      lista.push({
        type: resumo.riscoPrincipal.severidade === 'alto' ? 'alert' : 'opportunity',
        title: resumo.riscoPrincipal.titulo,
        description: resumo.riscoPrincipal.descricao,
        impact: `Severidade ${resumo.riscoPrincipal.severidade?.toUpperCase()}`,
        action: 'Explorar Risco', 
        infoTitle: 'Identificador de Risco',
        infoText: resumo.riscoPrincipal.codigo,
      });
    }

    // 2. Ação Prioritária (Backend-driven)
    if (resumo.acaoPrioritaria) {
      lista.push({
        type: 'opportunity',
        title: resumo.acaoPrioritaria.titulo,
        description: resumo.acaoPrioritaria.descricao,
        impact: resumo.acaoPrioritaria.impactoEsperado || 'Ajuste Estrutural',
        action: 'Ver Recomendação',
        infoTitle: 'Código da Ação',
        infoText: resumo.acaoPrioritaria.codigo,
      });
    }

    if (resumo.insightPrincipal) {
      lista.push({
        type: 'opportunity',
        title: resumo.insightPrincipal.titulo,
        description: resumo.insightPrincipal.descricao,
        impact: resumo.classificacao ? `Classificação ${resumo.classificacao.toUpperCase()}` : 'Ajuste Estrutural',
        action: resumo.insightPrincipal.acao,
        infoTitle: 'Insight Principal',
        infoText: 'Gerado pela penalidade de maior peso do motor de score.',
      });
    }

    // 3. Diagnóstico Geral (Contextual)
    if (resumo.diagnostico) {
      lista.push({
        type: 'positive',
        title: 'Diagnóstico Consolidado',
        description: resumo.diagnosticoFinal?.mensagem || resumo.diagnostico.resumo,
        impact: `Status: ${resumo.score.faixa}`,
        action: 'Análise Completa',
        infoTitle: 'Motor de Regras',
        infoText: `Último cálculo em ${new Date(resumo.score.atualizadoEm).toLocaleString('pt-BR')}`,
      });
    }

    return lista;
  }, [resumo]);

  const semBaseInsights = !loading && !error && resumo && (resumo.score?.score === 0 && !resumo.riscoPrincipal);

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218]">
      <div className="w-full">
        
        <div className="mb-16">
          <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
            <Microscope size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Diagnóstico do Sistema</span>
          </div>
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-4">Leitura de Cenário</h1>
          <p className="text-[#0B1218]/40 text-sm font-medium max-w-xl">
            Traduzimos o comportamento dos seus ativos em alertas lógicos. Sem opiniões, apenas estrutura.
          </p>
        </div>

        {loading && <p className="text-sm text-[#0B1218]/50 mb-6">Carregando insights...</p>}
        {error && <p className="text-sm text-[#E85C5C] mb-6">{error}</p>}
        {!loading && !error && !resumo && <p className="text-sm text-[#0B1218]/50 mb-6">Sem dados de insights no momento.</p>}

        {semBaseInsights && (
          <div className="p-8 border border-[#EFE7DC] rounded-sm text-center">
            <p className="text-sm text-[#0B1218]/60">
              Ainda não há base suficiente para calcular insights. Importe um CSV com ativos válidos para gerar score, riscos e ações prioritárias.
            </p>
            <button
              onClick={() => navigate('/importar')}
              className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Importar primeiro extrato
            </button>
          </div>
        )}

        {!loading && !error && resumo && !semBaseInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-16 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-6">
            {cards.map((card) => (
              <InsightCard key={card.title} {...card} />
            ))}
          </div>

          <aside className="space-y-12">
            <div className="bg-[#0B1218] p-8 text-white rounded-sm">
              <div className="flex items-center gap-2 mb-6">
                <Target size={18} className="text-[#F56A2A]" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Score de Saúde</h4>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-['Sora'] text-5xl font-bold">{resumo.score.score}</span>
                <span className="text-white/30 text-sm font-bold">/100</span>
              </div>
              <p className="text-white/40 text-xs leading-relaxed mb-8">
                {resumo.diagnosticoFinal?.mensagem || resumo.diagnostico.resumo}
              </p>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#F56A2A]" style={{ width: `${Math.max(0, Math.min(100, resumo.score.score))}%` }}></div>
              </div>
            </div>

            <div className="border border-[#EFE7DC] p-8 rounded-sm">
              <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-6">Pontos de Diagnóstico</h4>
              <ul className="space-y-4">
                {resumo.diagnostico.riscos.map((risco) => (
                <li key={risco.codigo} className="flex gap-3 text-xs text-[#0B1218]/60 leading-relaxed italic">
                  <span className="text-[#F56A2A]">"</span>
                  {risco.titulo}: {risco.descricao}
                </li>
                ))}
              </ul>
            </div>

            {resumo.pilares && (
              <div className="border border-[#EFE7DC] p-8 rounded-sm">
                <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-6">4 Pilares do Score</h4>
                <ul className="space-y-3 text-xs text-[#0B1218]/70">
                  <li>Estratégia da Carteira: {resumo.pilares.estrategiaCarteira}</li>
                  <li>Comportamento Financeiro: {resumo.pilares.comportamentoFinanceiro}</li>
                  <li>Estrutura Patrimonial: {resumo.pilares.estruturaPatrimonial}</li>
                  <li>Adequação ao Momento de Vida: {resumo.pilares.adequacaoMomentoVida}</li>
                </ul>
              </div>
            )}

            {resumo.impactoDecisoesRecentes?.quantidade > 0 && (
              <div className="border border-[#EFE7DC] p-8 rounded-sm bg-[#FDFCFB]">
                <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-3">Impacto das Decisões Recentes</h4>
                <p className="text-xs text-[#0B1218]/65 leading-relaxed">
                  {resumo.impactoDecisoesRecentes.deltaTotal >= 0 ? 'Efeito positivo' : 'Efeito negativo'} de {resumo.impactoDecisoesRecentes.deltaTotal.toFixed(1)} pontos no score em {resumo.impactoDecisoesRecentes.quantidade} simulações salvas.
                </p>
              </div>
            )}
          </aside>
        </div>
        )}

      </div>
    </div>
  );
}
