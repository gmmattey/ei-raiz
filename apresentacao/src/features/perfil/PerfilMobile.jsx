import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getStoredUser, perfilApi } from '../../cliente-api';
import { assetPath } from '../../utils/assetPath';

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
    { label: 'Contexto financeiro', icon: '/assets/icons/laranja/carteira-premium.svg', route: '/contexto-financeiro' },
    { label: 'Perfil de risco', icon: '/assets/icons/laranja/radar-premium.svg', route: '/perfil-de-risco' },
    { label: 'Configurações', icon: '/assets/icons/laranja/configuracoes-premium.svg', route: '/configuracoes' },
    { label: 'Histórico', icon: '/assets/icons/laranja/historico-premium.svg', route: '/historico' },
  ];

  return (
    <section className="space-y-4 pb-4">
      <header className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F56A2A]/10">
            <img src={assetPath('/assets/icons/laranja/perfil-premium.svg')} alt="" className="h-6 w-6" />
          </div>
          <div>
            <p className="font-['Sora'] text-[18px] font-bold text-[var(--text-primary)]">{usuario?.nome || 'Usuário'}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">{usuario?.email || 'Conta ativa'}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {itens.map((item) => (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className="flex flex-col items-start gap-2 rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-left active:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F56A2A]/10">
              <img src={assetPath(item.icon)} alt="" className="h-4 w-4" />
            </div>
            <p className="text-[12px] font-bold leading-tight text-[var(--text-primary)]">{item.label}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={async () => {
          try {
            await authApi.sair();
          } finally {
            navigate('/', { replace: true });
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#E85C5C]/40 bg-[var(--bg-card)] px-4 py-3 text-[13px] font-semibold text-[#E85C5C]"
      >
        Sair da conta
      </button>
    </section>
  );
}
