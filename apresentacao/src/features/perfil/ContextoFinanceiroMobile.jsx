import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  HardHat,
  Home,
  TrendingUp,
  UserRound,
  Gift,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import { perfilApi } from '../../cliente-api';

const CATEGORIAS_RENDA = [
  { id: 'clt', label: 'Salário CLT', Icon: Briefcase },
  { id: 'pj', label: 'Pró-labore / PJ', Icon: Building2 },
  { id: 'autonomo', label: 'Autônomo', Icon: HardHat },
  { id: 'aluguel', label: 'Aluguéis', Icon: Home },
  { id: 'dividendos', label: 'Dividendos', Icon: TrendingUp },
  { id: 'aposentadoria', label: 'Aposentadoria', Icon: UserRound },
  { id: 'beneficio', label: 'Benefícios', Icon: Gift },
  { id: 'outros', label: 'Outros', Icon: MoreHorizontal },
];

const STORAGE_KEY = 'ei.perfil.rendaBreakdown';

const parseCurrency = (s) => {
  const only = String(s ?? '').replace(/[^\d]/g, '');
  return only ? Number(only) / 100 : 0;
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v || 0));

const breakdownVazio = () =>
  CATEGORIAS_RENDA.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {});

const carregarBreakdown = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return { ...breakdownVazio(), ...parsed };
  } catch {
    return null;
  }
};

const salvarBreakdown = (breakdown) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(breakdown));
  } catch { /* noop */ }
};

export default function ContextoFinanceiroMobile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [breakdown, setBreakdown] = useState(breakdownVazio);
  const [aporteMensal, setAporteMensal] = useState(0);
  const [editandoId, setEditandoId] = useState(null);
  const [valorEdit, setValorEdit] = useState(0);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await perfilApi.obterPerfil();
        if (!ativo) return;
        const total = Number(dados?.rendaMensalBrl ?? 0);
        const stored = carregarBreakdown();
        if (stored) {
          setBreakdown(stored);
        } else if (total > 0) {
          setBreakdown({ ...breakdownVazio(), outros: total });
        }
        setAporteMensal(Number(dados?.aporteMensalBrl ?? 0));
      } catch {
        if (ativo) setErro('Não foi possível carregar o perfil.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  const totalRenda = useMemo(
    () => Object.values(breakdown).reduce((s, v) => s + Number(v || 0), 0),
    [breakdown],
  );

  const abrirEdicao = (id) => {
    setEditandoId(id);
    setValorEdit(Number(breakdown[id] || 0));
  };

  const confirmarEdicao = () => {
    if (!editandoId) return;
    const novo = { ...breakdown, [editandoId]: Number(valorEdit || 0) };
    setBreakdown(novo);
    setEditandoId(null);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    setSucesso(false);
    try {
      await perfilApi.atualizarPerfil({
        rendaMensalBrl: totalRenda,
        aporteMensalBrl: aporteMensal,
      });
      salvarBreakdown(breakdown);
      setSucesso(true);
      setTimeout(() => navigate('/perfil'), 600);
    } catch {
      setErro('Falha ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="space-y-4 pb-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A] mb-1">Perfil</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Contexto financeiro</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Detalhe suas fontes de renda para diagnósticos mais precisos.
        </p>
      </div>

      {loading ? (
        <p className="text-[12px] text-[var(--text-secondary)]">Carregando...</p>
      ) : (
        <>
          <article className="rounded-[16px] border border-[var(--border-color)] bg-gradient-to-br from-[#0B1218] to-[#1a2430] p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">Renda mensal total</p>
            <p className="mt-1 font-['Sora'] text-[28px] font-bold leading-none">{formatCurrency(totalRenda)}</p>
            <p className="mt-2 text-[11px] text-white/60">
              Soma das categorias abaixo.
            </p>
          </article>

          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS_RENDA.map(({ id, label, Icon }) => {
              const valor = Number(breakdown[id] || 0);
              const ativo = valor > 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => abrirEdicao(id)}
                  className={`flex flex-col items-start gap-1 rounded-[14px] border p-3 text-left transition ${
                    ativo
                      ? 'border-[#F56A2A] bg-[#F56A2A]/5'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                  }`}
                >
                  <Icon size={18} className={ativo ? 'text-[#F56A2A]' : 'text-[var(--text-secondary)]'} />
                  <span className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">{label}</span>
                  <span
                    className={`text-[12px] font-bold ${
                      ativo ? 'text-[#F56A2A]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {ativo ? formatCurrency(valor) : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Aporte mensal
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(aporteMensal)}
                onChange={(e) => setAporteMensal(parseCurrency(e.target.value))}
                className="mt-1 w-full rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[14px] font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[#F56A2A]"
              />
            </label>
          </article>

          {erro && (
            <div className="rounded-[12px] border border-[#E85C5C] bg-[#E85C5C]/10 p-3">
              <p className="text-[12px] font-medium text-[#E85C5C]">{erro}</p>
            </div>
          )}
          {sucesso && (
            <div className="rounded-[12px] border border-[#6FCF97] bg-[#6FCF97]/10 p-3">
              <p className="text-[12px] font-medium text-[#6FCF97]">Dados salvos.</p>
            </div>
          )}

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="w-full rounded-[14px] bg-[#F56A2A] py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      )}

      {editandoId && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => setEditandoId(null)}
          role="dialog"
        >
          <div
            className="w-full rounded-t-[20px] bg-[var(--bg-card)] p-5 pb-8"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border-color)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">
              {CATEGORIAS_RENDA.find((c) => c.id === editandoId)?.label}
            </p>
            <p className="mt-1 mb-4 text-[12px] text-[var(--text-secondary)]">
              Valor mensal médio desta fonte.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={formatCurrency(valorEdit)}
              onChange={(e) => setValorEdit(parseCurrency(e.target.value))}
              className="w-full rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-3 text-[18px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[#F56A2A]"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setEditandoId(null)}
                className="flex-1 rounded-[12px] border border-[var(--border-color)] py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEdicao}
                className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#F56A2A] py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-white"
              >
                <Check size={14} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
