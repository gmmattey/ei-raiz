import React from "react";
import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const loc = useLocation();
  const navItems = [
    { label: "Resumo", path: "/app/home", icon: "🏠" },
    { label: "Carteira", path: "/app/portfolio", icon: "📈" },
    { label: "Radar", path: "/app/radar", icon: "📡" },
    { label: "Histórico", path: "/app/history", icon: "🕒" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-default h-20 px-6 flex items-center justify-between z-50 md:hidden pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = loc.pathname === item.path || (item.path !== "/app/home" && loc.pathname.startsWith(item.path));
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? "text-brand-primary scale-110" : "text-text-secondary opacity-60"}`}
          >
            <span className="text-[20px]">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
