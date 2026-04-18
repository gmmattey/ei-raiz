import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carteiraApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

const ICON_BY_CATEGORY = {
  acoes: '/assets/icons/laranja/grafico-premium.svg',
  fundos: '/assets/icons/laranja/fundos-premium.svg',
  previdencia: '/assets/icons/laranja/previdencia-premium.svg',
  'renda-fixa': '/assets/icons/laranja/carteira-premium.svg',
  poupanca: '/assets/icons/laranja/carteira-premium.svg',
  bens: '/assets/icons/laranja/home-premium.svg',
};

const TYPE_BY_PARAM = {
  acoes: 'acao',
  fundos: 'fundo',
  previdencia: 'previdencia',
  'renda-fixa': 'renda_fixa',
  poupanca: 'poupanca',
  bens: 'bens',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function AssetCategoryMobile({ manualCategoriaId }) {
  const navigate = useNavigate();
  const { categoria } = useParams();
  const { ocultarValores } = useModoVisualizacao();
  const categoriaId = manualCategoriaId || categoria || 'acoes';
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        const tipo = TYPE_BY_PARAM[categoriaId] || categoriaId;
        const dados = await carteiraApi.obterDetalheCategoria(tipo);
        if (!ativo) return;
        setDetalhe(dados);
        setErro('');
      } catch {
        if (ativo) setErro('Nao foi possivel carregar esta categoria.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [categoriaId]);

  const ativos = useMemo(() => detalhe?.ativos || [], [detalhe]);
  const icon = ICON_BY_CATEGORY[categoriaId] || '/assets/icons/laranja/carteira-premium.svg';
  const titulo = detalhe?.categoria || categoriaId;
  const total = Number(detalhe?.totalCategoria || 0);

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate('/carteira')} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
          Voltar
        </button>
        <img src={assetPath(icon)} alt="" className="h-6 w-6" />
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Categoria</p>
        <p className="mt-1 font-['Sora'] text-[20px] font-bold text-[var(--text-primary)]">{String(titulo)}</p>
        <p className="mt-2 text-[12px] text-[var(--text-secondary)]">Total</p>
        <p className="text-[16px] font-bold text-[var(--text-primary)]">{ocultarValores ? '••••••' : formatCurrency(total)}</p>
      </article>

      <div className="space-y-2">
        {ativos.map((ativo) => (
          <button
            key={ativo.ticker || ativo.id}
            onClick={() => navigate(`/ativo/${encodeURIComponent(ativo.ticker || ativo.id)}`)}
            className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left"
          >
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{ativo.ticker || ativo.nome}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{ativo.nome || 'Ativo'}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-[var(--text-primary)]">{ocultarValores ? '••••••' : formatCurrency(ativo.valorAtual || ativo.valor || 0)}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{ativo.percentualCarteira ? `${Number(ativo.percentualCarteira).toFixed(1)}%` : ''}</p>
            </div>
          </button>
        ))}
      </div>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando ativos...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
      {!loading && !erro && ativos.length === 0 && <p className="text-[12px] text-[var(--text-secondary)]">Nenhum ativo nesta categoria.</p>}
    </section>
  );
}

