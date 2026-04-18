import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carteiraApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function DetalheAtivoMobile() {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const { ocultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ativo, setAtivo] = useState(null);

  useEffect(() => {
    let ativoTela = true;
    (async () => {
      try {
        setLoading(true);
        const dados = await carteiraApi.obterDetalheAtivo(String(ticker || ''));
        if (!ativoTela) return;
        setAtivo(dados);
        setErro('');
      } catch {
        if (ativoTela) setErro('Falha ao carregar o ativo.');
      } finally {
        if (ativoTela) setLoading(false);
      }
    })();
    return () => {
      ativoTela = false;
    };
  }, [ticker]);

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
          Voltar
        </button>
        <img src={assetPath('/assets/icons/laranja/carteira-premium.svg')} alt="" className="h-5 w-5" />
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Ativo</p>
        <p className="mt-1 font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">{ativo?.ticker || ticker}</p>
        <p className="text-[12px] text-[var(--text-secondary)]">{ativo?.nome || 'Detalhes da posicao'}</p>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-secondary)]">Valor atual</p>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{ocultarValores ? '••••••' : formatCurrency(ativo?.valorAtual || ativo?.valor || 0)}</p>
        </article>
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-secondary)]">Quantidade</p>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{ocultarValores ? '••••' : Number(ativo?.quantidade || 0).toLocaleString('pt-BR')}</p>
        </article>
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-secondary)]">Preco medio</p>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{ocultarValores ? '••••••' : formatCurrency(ativo?.precoMedio || 0)}</p>
        </article>
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-secondary)]">% carteira</p>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{ocultarValores ? '•••' : `${Number(ativo?.percentualCarteira || 0).toFixed(1)}%`}</p>
        </article>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/aportes')} className="rounded-[12px] bg-[#F56A2A] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Registrar aporte
        </button>
        <button onClick={() => navigate('/historico')} className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]">
          Ver historico
        </button>
      </div>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando ativo...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
    </section>
  );
}

