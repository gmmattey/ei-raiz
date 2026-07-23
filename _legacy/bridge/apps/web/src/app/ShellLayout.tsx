import React from 'react';
import type { RouteId } from '../core/router/routes';

export type NavItem = { id: RouteId; label: string; href: string };

const NAV: NavItem[] = [
  { id: 'home', label: 'Home', href: '/home' },
  { id: 'portfolio', label: 'Carteira', href: '/portfolio' },
  { id: 'radar', label: 'Radar', href: '/radar' },
  { id: 'history', label: 'Historico', href: '/history' },
  { id: 'profile', label: 'Perfil', href: '/profile' },
  { id: 'imports', label: 'Importacoes', href: '/imports' }
];

export interface ShellLayoutProps {
  title: string;
  activeRouteId: RouteId;
  onNavigate(href: string): void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function ShellLayout(props: ShellLayoutProps): JSX.Element {
  return (
    <div className="app">
      <div className="container" style={{ paddingTop: 18, paddingBottom: 28 }}>
        <header className="shellHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/brand/esquilo-icon.png"
              alt="Esquilo"
              width={34}
              height={34}
              style={{ borderRadius: 12, background: 'rgba(255,255,255,0.85)', boxShadow: 'var(--shadow-1)' }}
            />
            <div>
              <div style={{ fontWeight: 900 }}>{props.title}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Consolidar. Traduzir. Orientar.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {props.rightSlot ?? null}
          </div>
        </header>

        <nav className="shellNav" aria-label="Navegacao principal">
          {NAV.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`shellNavItem ${props.activeRouteId === it.id ? 'shellNavItemActive' : ''}`}
              aria-current={props.activeRouteId === it.id ? 'page' : undefined}
              onClick={() => props.onNavigate(it.href)}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <main style={{ marginTop: 14 }}>{props.children}</main>
      </div>
    </div>
  );
}

