import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { carteiraApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

const CATEGORIAS = [
  { key: 'acao', label: 'Acoes', route: '/acoes', icon: '/assets/icons/laranja/grafico-premium.svg' },
  { key: 'fundo', label: 'Fundos', route: '/fundos', icon: '/assets/icons/laranja/fundos-premium.svg' },
  { key: 'renda_fixa', label: 'Renda fixa', route: '/renda-fixa', icon: '/assets/icons/laranja/carteira-premium.svg' },
  { key: 'previdencia', label: 'Previdencia', route: '/previdencia', icon: '/assets/icons/laranja/previdencia-premium.svg' },
  { key: 'bens', label: 'Bens', route: '/bens', icon: '/assets/icons/laranja/home-premium.svg' },
  { key: 'poupanca', label: 'Poupanca', route: '/poupanca', icon: '/assets/icons/laranja/carteira-premium.svg' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function CarteiraMobile() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        const dados = await carteiraApi.obterDashboardPatrimonio();
        if (!ativo) return;
        setDashboard(dados);
        setErro('');
      } catch {
        if (ativo) setErro('Nao foi possivel carregar a carteira.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const cards = useMemo(() => {
    const totais = dashboard?.totais ?? {};
    return CATEGORIAS.map((categoria) => ({
      ...categoria,
      valor: Number(totais[categoria.key] ?? 0),
    })).sort((a, b) => b.valor - a.valor);
  }, [dashboard]);

  return (
    <section className="space-y-4 pb-4">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Carteira</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Visao por categoria</h1>
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[var(--text-secondary)]">Patrimonio consolidado</span>
          <span className="font-bold text-[#F56A2A]">
            {ocultarValores ? '••••••' : formatCurrency(dashboard?.totais?.todos ?? 0)}
          </span>
        </div>
      </article>

      <div className="space-y-2">
        {cards.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.route)}
            className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <img src={assetPath(item.icon)} alt="" className="h-5 w-5" />
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Toque para abrir detalhes</p>
              </div>
            </div>
            <p className="text-[12px] font-bold text-[var(--text-primary)]">
              {ocultarValores ? '••••••' : formatCurrency(item.valor)}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/aportes')} className="rounded-[12px] bg-[#F56A2A] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Registrar aporte
        </button>
        <button onClick={() => navigate('/historico')} className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]">
          Ver historico
        </button>
      </div>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando carteira...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
    </section>
  );
}

