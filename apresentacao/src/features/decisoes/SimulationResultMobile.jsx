import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { decisoesApi } from '../../cliente-api';
import { assetPath } from '../../utils/assetPath';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function SimulationResultMobile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [simulacao, setSimulacao] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await decisoesApi.obterSimulacao(String(id || ''));
        if (!ativo) return;
        setSimulacao(dados);
        setErro('');
      } catch {
        if (ativo) setErro('Nao foi possivel carregar o resultado.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id]);

  const resultado = simulacao?.resultado || {};
  const recomendacao = resultado?.recomendacao || simulacao?.resumoRecomendacao || 'Revise os parametros e compare cenarios.';

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate('/decisoes/historico')} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
          Voltar
        </button>
        <img src={assetPath('/assets/icons/laranja/score-premium.svg')} alt="" className="h-5 w-5" />
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Resultado da simulacao</p>
        <p className="mt-1 font-['Sora'] text-[20px] font-bold text-[var(--text-primary)]">{simulacao?.tipoDecisao || 'Decisao'}</p>
        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
          {simulacao?.criadoEm ? new Date(simulacao.criadoEm).toLocaleDateString('pt-BR') : 'Recente'}
        </p>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-secondary)]">Impacto projetado</p>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{formatCurrency(resultado?.impactoFinanceiro || resultado?.valorFinal || 0)}</p>
        </article>
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-secondary)]">Variacao score</p>
          <p className="text-[12px] font-bold text-[#F56A2A]">{Number(resultado?.deltaScore || 0) >= 0 ? '+' : ''}{Number(resultado?.deltaScore || 0).toFixed(1)} pts</p>
        </article>
      </div>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Orientacao</p>
        <p className="mt-2 text-[14px] leading-5 text-[var(--text-primary)]">{recomendacao}</p>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/decisoes')} className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]">
          Novo cenario
        </button>
        <button onClick={() => navigate('/insights')} className="rounded-[12px] bg-[#F56A2A] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Ver impacto
        </button>
      </div>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando resultado...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
    </section>
  );
}

