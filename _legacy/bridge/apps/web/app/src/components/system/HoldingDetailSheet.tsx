import { Link } from "react-router-dom";
import { BankLogo } from "@/components/brand/BankLogo";
import { Button } from "@/components/ui/button";
import { useGhostMode } from "@/core/contexts/GhostModeContext";

interface HoldingDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  holding: any | null; 
}

export function HoldingDetailSheet({ isOpen, onClose, holding }: HoldingDetailSheetProps) {
  const { isGhostMode } = useGhostMode();
  if (!holding) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-bg-primary rounded-t-[32px] p-8 pb-12 shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle bar */}
        <div className="mx-auto w-12 h-1.5 bg-border-default/40 rounded-full mb-8" />

        <header className="flex items-start justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-border-default">
                 <BankLogo id={holding.platformName ?? "generic"} className="w-10 h-10" />
              </div>
              <div>
                 <h2 className="font-display font-bold text-[24px] text-text-primary leading-tight">{holding.name}</h2>
                 <p className="font-bold text-[13px] text-text-disabled uppercase tracking-widest mt-1">{holding.code ?? "SEM CÓDIGO"}</p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-state-error transition-colors">
              <span className="text-[20px] font-bold">✕</span>
           </button>
        </header>

        <div className="grid grid-cols-2 gap-6 mb-10">
           <div className="p-5 bg-bg-surface rounded-2xl border border-border-default/30">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3">Saldo Atual</p>
              <p className="font-display font-bold text-[22px] text-text-primary tabular-nums">
                 {isGhostMode ? "•••••" : formatMoney(holding.currentValue)}
              </p>
           </div>
           <div className="p-5 bg-bg-surface rounded-2xl border border-border-default/30">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3">Rentabilidade</p>
              <p className={`font-display font-bold text-[22px] tabular-nums ${holding.performancePct != null && holding.performancePct >= 0 ? "text-state-success" : "text-state-error"}`}>
                 {holding.performancePct != null ? (holding.performancePct > 0 ? "+" : "") + holding.performancePct.toFixed(2) + "%" : "—"}
              </p>
           </div>
        </div>

        <div className="space-y-4 mb-10 text-[15px]">
           <div className="flex justify-between py-3 border-b border-border-default/30">
              <span className="text-text-secondary font-medium">Investido</span>
              <span className="font-bold text-text-primary">
                {isGhostMode ? "•••••" : formatMoney(holding.investedValue ?? holding.currentValue / 1.1)}
              </span>
           </div>
           <div className="flex justify-between py-3 border-b border-border-default/30">
              <span className="text-text-secondary font-medium">Quantidade</span>
              <span className="font-bold text-text-primary">{holding.quantity ?? "—"}</span>
           </div>
           <div className="flex justify-between py-3">
              <span className="text-text-secondary font-medium">Custodiado via</span>
              <span className="font-bold text-text-primary">{holding.platformName ?? "Plataforma Direta"}</span>
           </div>
        </div>

        <Button asChild className="w-full h-[64px] rounded-2xl bg-text-primary text-white font-bold text-[16px] transition-transform active:scale-95 shadow-xl shadow-black/10">
           <Link to={`/app/portfolio/detail/${holding.id}`}>Ver Histórico & Dividendos</Link>
        </Button>
      </div>
    </>
  );
}

function formatMoney(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
}
