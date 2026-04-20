import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patrimonioApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { mensagemMotivoIndisponivel } from '../../utils/motivoRentabilidade';

const moeda = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(Number(v ?? 0));

const fmtPct = (v) => {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return null;
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const LABEL_CATEGORIA = {
  acao: 'Ação', fii: 'FII', fundo: 'Fundo',
  renda_fixa: 'Renda Fixa', previdencia: 'Previdência',
  poupanca: 'Poupança', bens: 'Bens',
};

const LABEL_STATUS = {
  atualizado: 'Atualizado',
  atrasado:   'Defasado',
  indisponivel: 'Sem cotação',
};

const CORES_STATUS = {
  atualizado: '#6FCF97',
  atrasado:   '#F2C94C',
  indisponivel: '#E85C5C',
};

const formatarHora = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getField = (o, ...keys) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
};

export default function DetalheAtivoMobile() {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const { ocultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ativo, setAtivo] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        setLoading(true);
        const tickerAlvo = String(ticker || '').toUpperCase();
        const itensResp = await patrimonioApi.listarItens();
        if (!vivo) return;
        const itens = itensResp?.itens ?? [];
        const item = itens.find((i) => (i.ticker ?? '').toUpperCase() === tickerAlvo)
          ?? itens.find((i) => i.id === ticker);
        if (!item) {
          setErro('Ativo não encontrado na carteira.');
          return;
        }
        const TIPO_PARA_CATEGORIA = {
          acao: 'acao', fii: 'fii', etf: 'acao', fundo: 'fundo',
          previdencia: 'previdencia', renda_fixa: 'renda_fixa',
          poupanca: 'poupanca', imovel: 'bens', veiculo: 'bens',
        };
        setAtivo({
          id: item.id,
          ticker: item.ticker,
          nome: item.nome,
          categoria: TIPO_PARA_CATEGORIA[item.tipo] ?? 'outros',
          quantidade: item.quantidade ?? 0,
          precoMedio: item.precoMedioBrl ?? 0,
          precoAtual: item.precoAtualBrl,
          valorAtual: item.valorAtualBrl ?? 0,
          participacao: item.pesoPct ?? 0,
          rentabilidadeDesdeAquisicaoPct: item.rentabilidadePct,
          rentabilidadeConfiavel: item.rentabilidadePct != null,
          statusAtualizacao: item.precoAtualBrl != null ? 'atualizado' : 'indisponivel',
          ultimaAtualizacao: item.atualizadoEm,
          fontePreco: null,
          benchmarkDesdeAquisicao: null,
        });
        setErro('');
      } catch {
        if (vivo) setErro('Falha ao carregar o ativo.');
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [ticker]);

  const dados = useMemo(() => {
    if (!ativo) return null;
    const valorAtual   = Number(getField(ativo, 'valorAtual', 'valor_atual') ?? 0);
    const quantidade   = Number(ativo.quantidade ?? 0);
    const precoMedio   = Number(getField(ativo, 'precoMedio', 'preco_medio') ?? 0);
    const participacao = Number(ativo.participacao ?? 0);
    const categoria    = ativo.categoria || null;

    const rentabPct      = getField(ativo, 'rentabilidadeDesdeAquisicaoPct', 'rentabilidade_desde_aquisicao_pct');
    const rentabConfiavel = getField(ativo, 'rentabilidadeConfiavel', 'rentabilidade_confiavel') !== false;
    const rentab        = rentabConfiavel && Number.isFinite(Number(rentabPct)) ? Number(rentabPct) : null;
    const motivoCodigo   = getField(ativo, 'motivoRentabilidadeIndisponivel', 'motivo_rentabilidade_indisponivel');
    const motivoMsg      = rentab === null ? mensagemMotivoIndisponivel(motivoCodigo) : null;

    const statusCotacao    = getField(ativo, 'statusAtualizacao', 'status_atualizacao') || 'indisponivel';
    const fontePreco       = getField(ativo, 'fontePreco', 'fonte_preco') || null;
    const ultimaAtualizacao = getField(ativo, 'ultimaAtualizacao', 'ultima_atualizacao') || null;

    const benchmark = getField(ativo, 'benchmarkDesdeAquisicao', 'benchmark_desde_aquisicao');
    const retornoAtivo = Number.isFinite(Number(benchmark?.carteiraRetornoPeriodo)) ? Number(benchmark.carteiraRetornoPeriodo) : null;
    const retornoCDI   = Number.isFinite(Number(benchmark?.cdiRetornoPeriodo))     ? Number(benchmark.cdiRetornoPeriodo) : null;
    const excesso      = Number.isFinite(Number(benchmark?.excessoRetorno))        ? Number(benchmark.excessoRetorno) : null;

    return {
      valorAtual, quantidade, precoMedio, participacao, categoria,
      rentab, rentabConfiavel, motivoMsg,
      statusCotacao, fontePreco, ultimaAtualizacao,
      retornoAtivo, retornoCDI, excesso,
    };
  }, [ativo]);

  if (loading) {
    return (
      <section className="space-y-3 pb-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Carregando ativo...</p>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="space-y-3 pb-4">
        <button onClick={() => navigate(-1)} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
          Voltar
        </button>
        <p className="text-[12px] text-[#E85C5C]">{erro}</p>
      </section>
    );
  }

  if (!ativo || !dados) return null;

  const rentabColor = dados.rentab === null ? 'var(--text-muted)' : (dados.rentab >= 0 ? '#6FCF97' : '#E85C5C');

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
          ← Voltar
        </button>
        {dados.categoria && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[var(--bg-card-alt)] text-[var(--text-secondary)]">
            {LABEL_CATEGORIA[dados.categoria] || dados.categoria}
          </span>
        )}
      </header>

      {/* Cabeçalho do ativo */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Ativo</p>
        <p className="mt-1 font-['Sora'] text-[22px] font-bold text-[var(--text-primary)] leading-tight">
          {ativo?.ticker || ticker}
        </p>
        {ativo?.nome && ativo.nome !== ativo.ticker && (
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{ativo.nome}</p>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Valor atual</p>
            <p className="font-['Sora'] text-[24px] font-bold text-[var(--text-primary)] mt-0.5">
              {ocultarValores ? '••••••' : moeda(dados.valorAtual)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Desde aquisição</p>
            <p className="font-['Sora'] text-[16px] font-bold mt-0.5" style={{ color: rentabColor }}>
              {ocultarValores
                ? '••••'
                : dados.rentab === null
                  ? '—'
                  : fmtPct(dados.rentab)}
            </p>
          </div>
        </div>
        {!ocultarValores && dados.rentab === null && dados.motivoMsg && (
          <p className="mt-3 text-[11px] text-[var(--text-muted)] leading-snug">
            {dados.motivoMsg}
          </p>
        )}
      </article>

      {/* Métricas da posição */}
      <div className="grid grid-cols-3 gap-2">
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Quantidade</p>
          <p className="text-[13px] font-bold text-[var(--text-primary)] mt-0.5">
            {ocultarValores ? '••••' : Number(dados.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
          </p>
        </article>
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Preço médio</p>
          <p className="text-[13px] font-bold text-[var(--text-primary)] mt-0.5">
            {ocultarValores ? '••••' : moeda(dados.precoMedio)}
          </p>
        </article>
        <article className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">% carteira</p>
          <p className="text-[13px] font-bold text-[var(--text-primary)] mt-0.5">
            {ocultarValores ? '•••' : `${Number(dados.participacao).toFixed(1)}%`}
          </p>
        </article>
      </div>

      {/* Benchmark (Ativo vs CDI no período) — só aparece quando temos todos os números */}
      {dados.retornoAtivo !== null && dados.retornoCDI !== null && (
        <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Performance no período vs CDI
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-[var(--text-muted)]">Ativo</p>
              <p className={`text-[14px] font-bold mt-0.5 ${dados.retornoAtivo >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                {ocultarValores ? '••••' : fmtPct(dados.retornoAtivo)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)]">CDI</p>
              <p className="text-[14px] font-bold mt-0.5 text-[#3B82F6]">
                {ocultarValores ? '••••' : fmtPct(dados.retornoCDI)}
              </p>
            </div>
            {dados.excesso !== null && (
              <div>
                <p className="text-[10px] text-[var(--text-muted)]">Diferença</p>
                <p className={`text-[14px] font-bold mt-0.5 ${dados.excesso >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                  {ocultarValores ? '••••' : fmtPct(dados.excesso)}
                </p>
              </div>
            )}
          </div>
        </article>
      )}

      {/* Status da cotação */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Cotação</p>
            <p className="text-[13px] font-bold mt-0.5" style={{ color: CORES_STATUS[dados.statusCotacao] ?? '#F56A2A' }}>
              {LABEL_STATUS[dados.statusCotacao] ?? dados.statusCotacao}
            </p>
          </div>
          <div className="text-right">
            {dados.fontePreco && (
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                Fonte: <span className="text-[var(--text-secondary)]">{dados.fontePreco}</span>
              </p>
            )}
            {formatarHora(dados.ultimaAtualizacao) && (
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Atualizado em {formatarHora(dados.ultimaAtualizacao)}
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/aportes')} className="rounded-[12px] bg-[#F56A2A] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Registrar aporte
        </button>
        <button onClick={() => navigate('/historico')} className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]">
          Ver histórico
        </button>
      </div>
    </section>
  );
}
