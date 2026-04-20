import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carteiraApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';
import { mensagemMotivoIndisponivel } from '../../utils/motivoRentabilidade';

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

const LABEL_CATEGORIA = {
  acao: 'Ações', fundo: 'Fundos',
  renda_fixa: 'Renda Fixa', previdencia: 'Previdência',
  poupanca: 'Poupança', bens: 'Bens',
};

const STATUS_PONTO = {
  atualizado:   { cor: '#6FCF97', titulo: 'Cotação atualizada' },
  atrasado:     { cor: '#F2C94C', titulo: 'Cotação defasada' },
  indisponivel: { cor: '#E85C5C', titulo: 'Sem cotação' },
};

const moeda = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0));

const fmtPct = (v) => {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return null;
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const getField = (o, ...keys) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
};

export default function AssetCategoryMobile({ manualCategoriaId }) {
  const navigate = useNavigate();
  const { categoria } = useParams();
  const { ocultarValores } = useModoVisualizacao();
  const categoriaId = manualCategoriaId || categoria || 'acoes';
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        setLoading(true);
        const tipo = TYPE_BY_PARAM[categoriaId] || categoriaId;
        const dados = await carteiraApi.obterDetalheCategoria(tipo);
        if (!vivo) return;
        setDetalhe(dados);
        setErro('');
      } catch {
        if (vivo) setErro('Não foi possível carregar esta categoria.');
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [categoriaId]);

  const ativos = useMemo(() => detalhe?.ativos || [], [detalhe]);

  // Agregados para o card da categoria: média ponderada de rentabilidade,
  // contagem com rentabilidade confiável. Ativos sem rentabilidade auditável
  // são excluídos da média — não queremos arrastar média para zero com "—".
  const agregados = useMemo(() => {
    let somaPonderada = 0;
    let pesoTotal = 0;
    let confiaveis = 0;
    for (const a of ativos) {
      const rentab = getField(a, 'rentabilidadeDesdeAquisicaoPct', 'rentabilidade_desde_aquisicao_pct');
      const confiavel = getField(a, 'rentabilidadeConfiavel', 'rentabilidade_confiavel') !== false;
      const peso = Number(a?.valorAtual ?? a?.valor ?? 0);
      if (confiavel && Number.isFinite(Number(rentab)) && peso > 0) {
        somaPonderada += Number(rentab) * peso;
        pesoTotal += peso;
        confiaveis += 1;
      }
    }
    return {
      mediaRentab: pesoTotal > 0 ? somaPonderada / pesoTotal : null,
      confiaveis,
      total: ativos.length,
    };
  }, [ativos]);

  const icon = ICON_BY_CATEGORY[categoriaId] || '/assets/icons/laranja/carteira-premium.svg';
  const tituloCategoria = LABEL_CATEGORIA[detalhe?.categoria] || detalhe?.categoria || categoriaId;
  const total = Number(getField(detalhe, 'valorTotal', 'totalCategoria', 'total') ?? 0);
  const participacao = Number(detalhe?.participacao ?? 0);

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate('/carteira')} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
          ← Voltar
        </button>
        <img src={assetPath(icon)} alt="" className="h-6 w-6" />
      </header>

      {/* Card da categoria */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Categoria</p>
        <p className="mt-1 font-['Sora'] text-[20px] font-bold text-[var(--text-primary)]">{String(tituloCategoria)}</p>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Valor</p>
            <p className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)] mt-0.5">
              {ocultarValores ? '••••••' : moeda(total)}
            </p>
            {participacao > 0 && (
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {participacao.toFixed(1)}% da carteira
              </p>
            )}
          </div>
          {agregados.mediaRentab !== null && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Média ponderada
              </p>
              <p className={`font-['Sora'] text-[16px] font-bold mt-0.5 ${
                agregados.mediaRentab >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'
              }`}>
                {ocultarValores ? '••••' : fmtPct(agregados.mediaRentab)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {agregados.confiaveis} de {agregados.total} ativos
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Lista de ativos com signals */}
      <div className="space-y-2">
        {ativos.map((a, idx) => {
          const rentabRaw = getField(a, 'rentabilidadeDesdeAquisicaoPct', 'rentabilidade_desde_aquisicao_pct');
          const confiavel = getField(a, 'rentabilidadeConfiavel', 'rentabilidade_confiavel') !== false;
          const rentab = confiavel && Number.isFinite(Number(rentabRaw)) ? Number(rentabRaw) : null;
          const motivoCodigo = getField(a, 'motivoRentabilidadeIndisponivel', 'motivo_rentabilidade_indisponivel');
          const motivoMsg = rentab === null ? mensagemMotivoIndisponivel(motivoCodigo) : null;
          const status = getField(a, 'statusAtualizacao', 'status_atualizacao') || 'indisponivel';
          const pontoStatus = STATUS_PONTO[status] ?? STATUS_PONTO.indisponivel;
          const valor = Number(a?.valorAtual ?? a?.valor ?? 0);
          const part = a?.participacao;

          return (
            <button
              key={`${a.id ?? a.ticker ?? 'ativo'}-${idx}`}
              onClick={() => navigate(`/ativo/${encodeURIComponent(a.ticker || a.id)}`)}
              className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ background: pontoStatus.cor }}
                    title={pontoStatus.titulo}
                  />
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                    {a.ticker || a.nome}
                  </p>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {a.nome || 'Ativo'}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-[12px] font-bold text-[var(--text-primary)]">
                  {ocultarValores ? '••••••' : moeda(valor)}
                </p>
                <div className="flex items-center gap-2 justify-end mt-0.5">
                  {part != null && (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {Number(part).toFixed(1)}%
                    </p>
                  )}
                  <p
                    className={`text-[10px] font-bold ${
                      rentab === null
                        ? 'text-[var(--text-muted)]'
                        : rentab >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'
                    }`}
                    title={motivoMsg ?? undefined}
                  >
                    {ocultarValores ? '••••' : (rentab === null ? '—' : fmtPct(rentab))}
                  </p>
                </div>
                {!ocultarValores && motivoMsg && (
                  <p className="text-[9px] text-[var(--text-muted)] mt-1 max-w-[180px] text-right leading-snug">
                    {motivoMsg}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando ativos...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
      {!loading && !erro && ativos.length === 0 && (
        <p className="text-[12px] text-[var(--text-secondary)]">Nenhum ativo nesta categoria.</p>
      )}
    </section>
  );
}
