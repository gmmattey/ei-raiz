import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, perfilApi } from '../../cliente-api';
import { assetPath } from '../../utils/assetPath';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function PerfilMobile() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await perfilApi.obterPerfil();
        if (!ativo) return;
        setUsuario(getStoredUser());
        setPerfil({
          rendaMensal: Number(dados?.rendaMensalBrl ?? 0),
          aporteMensal: Number(dados?.aporteMensalBrl ?? 0),
          perfilRisco: dados?.toleranciaRisco ?? null,
        });
      } catch {
        // Mantem estado sem bloquear a tela.
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const itens = [
    { label: 'Perfil de risco', sub: perfil?.perfilRisco || 'Definir perfil', icon: '/assets/icons/laranja/radar-premium.svg', route: '/perfil-de-risco' },
    { label: 'Configuracoes', sub: 'Preferencias de conta e privacidade', icon: '/assets/icons/laranja/configuracoes-premium.svg', route: '/configuracoes' },
    { label: 'Historico', sub: 'Movimentacoes e snapshots', icon: '/assets/icons/laranja/historico-premium.svg', route: '/historico' },
  ];

  return (
    <section className="space-y-4 pb-4">
      <header className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F56A2A]/10">
            <img src={assetPath('/assets/icons/laranja/perfil-premium.svg')} alt="" className="h-6 w-6" />
          </div>
          <div>
            <p className="font-['Sora'] text-[18px] font-bold text-[var(--text-primary)]">{usuario?.nome || 'Usuario'}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">{usuario?.email || 'Conta ativa'}</p>
          </div>
        </div>
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Contexto financeiro</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-[var(--border-color)] px-3 py-2">
            <p className="text-[10px] text-[var(--text-secondary)]">Renda mensal</p>
            <p className="text-[12px] font-bold text-[var(--text-primary)]">{formatCurrency(perfil?.rendaMensal || 0)}</p>
          </div>
          <div className="rounded-[12px] border border-[var(--border-color)] px-3 py-2">
            <p className="text-[10px] text-[var(--text-secondary)]">Aporte mensal</p>
            <p className="text-[12px] font-bold text-[var(--text-primary)]">{formatCurrency(perfil?.aporteMensal || 0)}</p>
          </div>
        </div>
      </article>

      <div className="space-y-2">
        {itens.map((item) => (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <img src={assetPath(item.icon)} alt="" className="h-5 w-5" />
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">{item.sub}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">Abrir</span>
          </button>
        ))}
      </div>
    </section>
  );
}

