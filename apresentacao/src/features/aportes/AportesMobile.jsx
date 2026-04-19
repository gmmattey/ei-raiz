import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, aportesApi } from '../../cliente-api';

const moeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);
const parseCurrencyInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
};
const formatCurrencyInput = (value) => moeda(Number(value || 0));

export default function AportesMobile() {
  const navigate = useNavigate();
  const [aportes, setAportes] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState('');

  const recarregar = useCallback(async () => {
    try {
      const [lista, res] = await Promise.all([
        aportesApi.listarAportes(30),
        aportesApi.obterResumoAportes(),
      ]);
      setAportes(lista ?? []);
      setResumo(res ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => { recarregar(); }, [recarregar]);

  const salvar = async () => {
    const v = Math.max(0, Number(valor) || 0);
    if (v <= 0) { setFeedback('Informe um valor maior que zero.'); return; }
    if (!data) { setFeedback('Informe a data do aporte.'); return; }
    try {
      setSalvando(true);
      setFeedback('');
      await aportesApi.criarAporte({
        valor: v,
        dataAporte: data,
        observacao: observacao.trim() || undefined,
        origem: 'manual',
      });
      setValor(0);
      setObservacao('');
      setFeedback('Aporte registrado.');
      await recarregar();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { navigate('/', { replace: true }); return; }
      setFeedback('Falha ao registrar o aporte.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id) => {
    try { await aportesApi.removerAporte(id); await recarregar(); } catch { /* noop */ }
  };

  return (
    <section className="space-y-4 pb-4">
      <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Aportes</h1>

      {resumo && (
        <p className="text-xs text-[var(--text-muted)]">
          {resumo.mesesDistintos6m} mes(es) com aporte nos últimos 6 meses · {moeda(resumo.valorTotal6m)}
        </p>
      )}

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Novo aporte</p>
        <input
          type="text"
          inputMode="numeric"
          value={formatCurrencyInput(valor)}
          onChange={(e) => setValor(parseCurrencyInput(e.target.value))}
          className="w-full rounded-[12px] border border-[var(--border-color)] px-3 py-3 text-sm bg-[var(--bg-card)]"
          placeholder="Valor do aporte (R$)"
        />
        <input
          type="date"
          value={data}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-[12px] border border-[var(--border-color)] px-3 py-3 text-sm bg-[var(--bg-card)]"
        />
        <input
          type="text"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          maxLength={200}
          className="w-full rounded-[12px] border border-[var(--border-color)] px-3 py-3 text-sm bg-[var(--bg-card)]"
          placeholder="Observação (opcional)"
        />
        <button
          onClick={salvar}
          disabled={salvando}
          className="h-11 w-full rounded-[12px] bg-[#F56A2A] text-[11px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar aporte'}
        </button>
        {feedback && (
          <p className={`text-xs font-semibold ${feedback === 'Aporte registrado.' ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
            {feedback}
          </p>
        )}
      </article>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Histórico</p>
        {aportes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhum aporte registrado.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {aportes.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{moeda(a.valor)}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {new Date(a.dataAporte).toLocaleDateString('pt-BR')} · {a.origem}
                    {a.observacao ? ` · ${a.observacao}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => excluir(a.id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#E85C5C]"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
