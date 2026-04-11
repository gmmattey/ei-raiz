import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { adminApi, clearSession, configApi, getStoredUser } from '../../cliente-api';
import { Menu, X } from 'lucide-react';

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState(false);

  const fallbackNavItems = [
    { label: 'Home', path: '/home' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Carteira', path: '/carteira' },
    { label: 'Aportes', path: '/aportes' },
    { label: 'Insights', path: '/insights' },
    { label: 'Decisões', path: '/decisoes' },
    { label: 'Histórico', path: '/historico' },
    { label: 'Importar', path: '/importar' },
  ];
  const [navItems, setNavItems] = useState(fallbackNavItems);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        setUsuario(getStoredUser());
        const appConfig = await configApi.obterAppConfig();
        const acessoAdmin = await adminApi.obterMeAdmin().catch(() => ({ isAdmin: false }));
        if (!ativo) return;
        const itens = (appConfig.menus ?? [])
          .filter((item) => item.visivel)
          .sort((a, b) => a.ordem - b.ordem)
          .map((item) => ({ label: item.label, path: item.path }));
        setNavItems(itens.length ? itens : fallbackNavItems);
        setIsAdmin(Boolean(acessoAdmin?.isAdmin));
      } catch {
        if (ativo) setNavItems(fallbackNavItems);
      }
    };
    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const profileItems = [
    { label: 'Meu Perfil', icon: assetPath('/assets/icons/preto/perfil.svg'), action: () => navigate('/perfil') },
    { label: 'Perfil de Risco', icon: assetPath('/assets/icons/preto/radar.svg'), action: () => navigate('/perfil-de-risco') },
    { label: 'Configurações', icon: assetPath('/assets/icons/preto/configuracoes.svg'), action: () => navigate('/configuracoes') },
    ...(isAdmin ? [{ label: 'Painel Admin', icon: assetPath('/assets/icons/preto/score.svg'), action: () => navigate('/admin') }] : []),
    { 
      label: 'Sair da conta', 
      icon: assetPath('/assets/icons/preto/fechar.svg'),
      color: 'text-[#E85C5C]', 
      action: () => {
        clearSession();
        localStorage.removeItem('hasSeenPreInsight');
        window.location.href = '/';
      } 
    },
  ];

  const inicialUsuario = usuario?.nome?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#EFE7DC] bg-[#0B1218]">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="shrink-0 cursor-pointer" onClick={() => navigate('/home')}>
            <img
              src={assetPath('/assets/logo/logo-horizontal-fundo-escuro-invest-laranja.svg')}
              alt="Logo Esquilo Invest"
              className="h-10 object-contain"
            />
          </div>

          <nav className="hidden h-full items-center gap-0 md:flex">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex h-full items-center border-b-2 px-3 lg:px-4 text-[9px] font-bold uppercase tracking-[0.18em] transition-all lg:text-[10px] ${
                  location.pathname === item.path
                    ? 'border-[#F56A2A] text-[#F56A2A]'
                    : 'border-transparent text-white/30 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-5">
            <button className="text-white/20 transition-colors hover:text-[#F56A2A]">
              <img
                src={assetPath('/assets/icons/branco/alerta.svg')}
                alt="Alertas"
                className="h-[18px] w-[18px] opacity-60 transition-opacity hover:opacity-100"
              />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 rounded-sm border border-white/10 bg-white/5 p-1 pr-3 transition-all hover:bg-white/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#F5F0EB] text-[10px] font-bold uppercase text-[#0B1218]">
                  {inicialUsuario}
                </div>
                <img
                  src={assetPath('/assets/icons/branco/chevron-baixo.svg')}
                  alt=""
                  className={`h-[14px] w-[14px] opacity-60 transition-all ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 z-[60] mt-4 w-52 rounded-sm border border-[#EFE7DC] bg-white p-2 text-left shadow-2xl animate-in slide-in-from-top-2">
                    {profileItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.action(); setMenuOpen(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#F5F0EB] ${item.color || 'text-[#0B1218]/60'}`}
                      >
                        <img src={item.icon} alt="" className="h-[14px] w-[14px] shrink-0" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="text-white/50 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1218] border-b border-white/10 p-4 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              className={`w-full text-left p-4 text-xs font-bold uppercase tracking-widest ${location.pathname === item.path ? 'text-[#F56A2A]' : 'text-white/40'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
