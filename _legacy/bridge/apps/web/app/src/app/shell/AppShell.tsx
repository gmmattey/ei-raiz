import * as React from "react";
import { NavLink, Outlet, Link, useLocation, useNavigation } from "react-router-dom";
import { useAppStore } from "@/core/state/app_store";
import { Logo } from "@/components/brand/Logo";
import { Icon, type IconName } from "@/components/brand/Icon";
import { useGhostMode } from "@/core/contexts/GhostModeContext";
import { EyeIcon, EyeOffIcon } from "@/components/system/Icons";
import { PWAInstallNudge } from "@/components/system/PWAInstallNudge";
import { GlobalErrorModal } from "@/components/system/GlobalErrorModal";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const store = useAppStore();
  const location = useLocation();
  const navigation = useNavigation();
  const { isGhostMode, toggle: toggleGhost } = useGhostMode();
  const isNavigating = navigation.state !== "idle";

  React.useEffect(() => {
    store.setState((s) => ({ ...s, route: { path: location.pathname } }));
  }, [location.pathname, store]);

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col">
      {isNavigating ? <NavigationProgress /> : null}
      <PWAInstallNudge />
      
      <header className="sticky top-0 z-[60] border-b border-border-default/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 h-20">
          <div className="flex items-center gap-8">
            <Link to="/app/home" className="transition-transform active:scale-95">
              <Logo kind="simbolo" className="h-10 w-auto md:hidden" />
              <Logo kind="horizontal" className="h-8 w-auto hidden md:block" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-bg-secondary p-1.5 rounded-2xl border border-border-default/50 shadow-inner">
              <TopLink to="/app/home" end icon="home" filledIcon="home-filled">Resumo</TopLink>
              <TopLink to="/app/portfolio" icon="carteira" filledIcon="carteira-filled">Carteira</TopLink>
              <TopLink to="/app/radar" icon="radar">Radar</TopLink>
              <TopLink to="/app/history" icon="historico">Histórico</TopLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleGhost}
              className="p-3 rounded-2xl hover:bg-bg-secondary text-text-secondary hover:text-brand-primary transition-all border border-transparent hover:border-border-default/50"
              title="Modo Fantasma"
            >
              {isGhostMode ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
            
            <div className="h-8 w-px bg-border-default mx-2 hidden md:block" />
            
            <NavLink to="/app/profile" className={({ isActive }) => `flex items-center gap-3 p-2 pl-4 pr-3 rounded-2xl border transition-all ${isActive ? 'bg-brand-primary/5 border-brand-primary text-brand-primary' : 'border-border-default hover:bg-bg-secondary'}`}>
               <span className="text-[13px] font-bold hidden lg:block">Meu Cofre</span>
               <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Icon name="perfil" className="w-4 h-4" />
               </div>
            </NavLink>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden animate-fluid-in">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

function TopLink({
  to,
  end,
  icon,
  filledIcon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: IconName;
  filledIcon?: IconName;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-3 py-2 ty-label transition-colors",
          isActive
            ? "bg-bg-primary text-text-primary shadow-sm"
            : "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
        ].join(" ")
      }
    >
      {({ isActive }) => {
        const iconName = isActive ? (filledIcon ?? icon) : icon;
        return (
          <>
            <Icon name={iconName} className="text-[18px]" />
            <span>{children}</span>
          </>
        );
      }}
    </NavLink>
  );
}

function NavigationProgress() {
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-50 h-0.5 w-full overflow-hidden bg-transparent">
      <div className="h-full w-full animate-nav-progress bg-gradient-to-r from-brand-primary via-text-secondary to-brand-primary" />
    </div>
  );
}
