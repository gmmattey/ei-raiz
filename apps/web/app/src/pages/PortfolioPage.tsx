import React from "react";
import { useDataSources } from "@/core/data/react";
import type { PortfolioData } from "@/core/data/contracts";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  BlockedState,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/system/SystemState";
import { BottomNav } from "@/components/system/BottomNav";
import { useGhostMode } from "@/core/contexts/GhostModeContext";
import { BankLogo } from "@/components/brand/BankLogo";
import { EyeIcon, EyeOffIcon, RefreshIcon } from "@/components/system/Icons";
import { PullToRefresh } from "@/components/system/PullToRefresh";
import { HoldingDetailSheet } from "@/components/system/HoldingDetailSheet";

export function PortfolioPage() {
  const { isGhostMode } = useGhostMode();
  const ds = useDataSources();
  const [performance, setPerformance] = React.useState<"all" | "best" | "worst">("all");
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);
  const [data, setData] = React.useState<PortfolioData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedHolding, setSelectedHolding] = React.useState<any | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await ds.portfolio.getPortfolio({ performance });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eita, não conseguimos buscar seus investimentos. Tenta atualizar a página!");
    }
  }, [ds, performance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (!data || data.screenState !== "ready") return;
    
    // Header Branded
    const day = new Date().toLocaleDateString('pt-BR');
    const brandedHeader = [
      "-----------------------------------------------------------",
      "             ESQUILO INVEST - RELATÓRIO DE ATIVOS          ",
      `             GERADO EM: ${day}                             `,
      "-----------------------------------------------------------",
      "",
      "Categoria,Ativo,Ticker,Plataforma,Rentabilidade (%),Valor Atual (BRL)",
    ].join("\n");

    const rows = data.groups.flatMap((g: any) => 
      g.holdings.map((h: any) => [
        g.categoryLabel,
        h.name,
        h.code ?? "-",
        h.platformName ?? "-",
        h.performancePct?.toFixed(2) ?? "0.00",
        h.currentValue.toFixed(2)
      ].join(","))
    ).join("\n");

    const csvContent = brandedHeader + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Carteira_Esquilo_${day.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-dvh bg-bg-primary flex flex-col animate-fluid-in">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:py-16 pb-32">
          <header className="mb-12 border-b border-border-default/50 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Análise Macro</p>
                <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none">Minha Grade de Ativos</h1>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleExportCSV} variant="secondary" className="h-12 px-6 font-bold text-[14px] bg-white border border-border-default shadow-sm hover:bg-bg-secondary hidden sm:flex items-center gap-2">
                   <span>📥</span> Exportar CSV
                </Button>
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`p-3 rounded-full hover:bg-bg-secondary transition-all text-text-secondary hover:text-brand-primary ${refreshing ? 'animate-spin' : ''}`}
                  title="Atualizar dados"
                >
                  <RefreshIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <Button asChild variant="secondary" className="h-12 px-6 font-bold text-[14px] bg-white border border-border-default shadow-sm hover:bg-bg-secondary">
                  <Link to="/app/home">&larr; Voltar ao Painel</Link>
                </Button>
              </div>
            </div>
          </header>

        {/* Controladores */}
        <div className="flex flex-col md:flex-row gap-8 mb-16 px-1">
          <div className="flex-1">
            <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-3 block">Buscar Ativo</label>
            <div className="relative">
              <input
                className="w-full h-14 rounded-xl border border-border-default bg-white px-6 pl-12 text-[16px] outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                placeholder="Ex: ITSA, Nubank, Tesouro..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] opacity-30">🔍</span>
            </div>
          </div>
          <div className="md:w-auto">
            <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-3 block">Filtro de Performance</label>
            <div className="flex bg-white p-1 rounded-xl border border-border-default shadow-sm">
              {["all", "best", "worst"].map((p) => {
                 const labels = { all: "Todas", best: "Melhores (+)", worst: "Piores (-)" };
                 const isActive = performance === p;
                 return (
                    <button
                      key={p}
                      onClick={() => setPerformance(p as typeof performance)}
                      className={`px-6 py-3 text-[14px] font-bold rounded-lg transition-all ${
                        isActive ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {labels[p as keyof typeof labels]}
                    </button>
                 )
              })}
            </div>
          </div>
        </div>

        {/* States */}
        {error ? (
          <div className="mt-10">
            <ErrorState
              title="Ops, deu um tropeço na sua carteira"
              body={error}
              ctaLabel="Tentar de novo"
              ctaTarget="/app/portfolio"
              secondaryCtaLabel="Ir para o Início"
              secondaryCtaTarget="/app/home"
            />
          </div>
        ) : !data ? (
          <div className="mt-10">
             <LoadingState title="Contando suas cotas..." body="Estamos organizando a lista de tudo que você tem." />
          </div>
        ) : data.screenState === "redirect_onboarding" ? (
          <div className="mt-10">
             <BlockedState
              title="Cofre ainda trancado"
              body="Termine seu cadastro rápido para liberar a visão detalhada de todos os seus ativos."
              ctaLabel="Bora Terminar"
              ctaTarget={normalizeAppTarget(data.redirectTo)}
              secondaryCtaLabel="Ir para Importação"
              secondaryCtaTarget="/app/import"
            />
          </div>
        ) : data.screenState === "empty" ? (
          <div className="mt-10">
            <EmptyState
              title="Sua carteira está no zero!"
              body="Parece que você ainda não trouxe seus ativos para cá. Que tal fazer sua primeira importação agora?"
              ctaLabel="Importar Planilha"
              ctaTarget={normalizeAppTarget(data.emptyState.target)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            {(() => {
              const q = deferredQuery.trim().toLowerCase();
              const groups = data.groups
                .map((g) => {
                  if (!q) return g;
                  const holdings = g.holdings.filter((h) => {
                    const hay = [h.name, h.code ?? "", h.platformName ?? ""].join(" ").toLowerCase();
                    return hay.includes(q);
                  });
                  return { ...g, holdings };
                })
                .filter((g) => g.holdings.length > 0);

              if (q && groups.length === 0) {
                return (
                  <div className="py-20 text-center border-2 border-dashed border-border-default rounded-2xl bg-bg-surface/50">
                    <h2 className="font-display font-bold text-[28px] text-text-primary">Não achamos esse aí</h2>
                    <p className="text-[16px] text-text-secondary mt-3">Nenhum ativo bateu com "{query}". Confirma o código ou a corretora?</p>
                    <Button variant="secondary" className="mt-8 font-bold h-12 px-8 bg-white border border-border-default" onClick={() => setQuery("")}>Limpar tudo</Button>
                  </div>
                );
              }

              return groups.map((g) => (
                <div key={g.categoryKey} className="group">
                  <div className="flex items-end justify-between border-b-2 border-text-primary pb-4 mb-4">
                    <h3 className="font-display font-bold text-[26px] text-text-primary tracking-tight">{g.categoryLabel}</h3>
                    <div className="text-right">
                       <p className="text-[11px] font-bold text-text-secondary uppercase mb-1 tracking-widest">Total na Categoria</p>
                       <span className="font-display font-bold text-[24px] tabular-nums text-text-primary leading-none">
                         {isGhostMode ? "•••••" : formatMoney(g.totalCurrent)}
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {/* Table Header (Desktop) */}
                    <div className="hidden md:grid grid-cols-[1fr_120px_180px] gap-8 py-4 border-b border-border-default/30 px-4">
                      <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em]">Ativo & Custódia</span>
                      <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em] text-right">Rentabilidade</span>
                      <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em] text-right">Saldo Atual</span>
                    </div>

                    {g.holdings.map((h) => (
                      <div 
                        key={h.id} 
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                             setSelectedHolding(h);
                          }
                        }}
                        className="grid grid-cols-1 md:grid-cols-[1fr_120px_180px] gap-3 md:gap-8 py-6 px-4 border-b border-border-default/30 hover:bg-white hover:shadow-md transition-all rounded-xl items-center group/row cursor-pointer active:scale-[0.98] active:bg-bg-secondary/30 touch-manipulation"
                      >
                        
                        {/* Name Col */}
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-3">
                            <BankLogo id={h.platformName ?? "generic"} className="w-8 h-8 md:w-10 md:h-10" />
                            <div className="min-w-0">
                               <Link
                                to={`/app/portfolio/detail/${encodeURIComponent(h.id)}`}
                                onClick={(e) => {
                                  if (window.innerWidth < 1024) {
                                    e.preventDefault();
                                  }
                                }}
                                className="font-bold text-[18px] text-text-primary hover:text-brand-primary truncate transition-colors leading-tight block"
                              >
                                {h.name}
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-[11px] bg-bg-secondary px-2 py-0.5 rounded text-text-primary tracking-widest uppercase">{h.code ?? "—"}</span>
                            {h.platformName ? <span className="text-[13px] font-medium text-text-secondary opacity-60">via {h.platformName}</span> : ""}
                          </div>
                        </div>

                        {/* Performance Col */}
                        <div className="flex md:block justify-between items-center text-right mt-3 md:mt-0">
                           <span className="md:hidden text-[13px] font-bold text-text-secondary uppercase tracking-widest">Rentabilidade:</span>
                           <p className={`font-bold tabular-nums text-[17px] tracking-tight ${h.performancePct != null && h.performancePct >= 0 ? "text-state-success" : h.performancePct != null && h.performancePct < 0 ? "text-state-error" : "text-text-primary"}`}>
                             {h.performancePct != null ? (h.performancePct > 0 ? "+" : "") + h.performancePct.toFixed(2) + "%" : "—"}
                           </p>
                        </div>

                        {/* Value Col */}
                         <div className="flex md:block justify-between items-center text-right">
                           <span className="md:hidden text-[13px] font-bold text-text-secondary uppercase tracking-widest">Saldo:</span>
                           <p className="font-display font-bold tabular-nums text-[22px] text-text-primary tracking-tighter">
                             {isGhostMode ? "•••••" : formatMoney(h.currentValue)}
                           </p>
                         </div>

                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
      
      <BottomNav />
      
      <HoldingDetailSheet 
        isOpen={!!selectedHolding} 
        onClose={() => setSelectedHolding(null)} 
        holding={selectedHolding} 
      />
    </div>
    </PullToRefresh>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}

function formatMoney(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
}
