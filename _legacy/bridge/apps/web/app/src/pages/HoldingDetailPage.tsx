import * as React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import type { HoldingDetailData, HoldingDetailDataReady } from "@/core/data/contracts";
import { BlockedState, ErrorState, LoadingState } from "@/components/system/SystemState";
import { BottomNav } from "@/components/system/BottomNav";

export function HoldingDetailPage() {
  const { portfolioId, holdingId } = useParams();
  const ds = useDataSources();
  const [data, setData] = React.useState<HoldingDetailData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!portfolioId || !holdingId) return;
      try {
        const res = await ds.holdingDetail.getHoldingDetail({ portfolioId, holdingId });
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        setData(res.data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Eita, não conseguimos buscar o detalhe desse papel. Recarrega a página!");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds, portfolioId, holdingId]);

  // Type Narrowing
  const isRedirect = data && data.screenState === "redirect_onboarding";
  const detailData = (data && !data.screenState) ? (data as HoldingDetailDataReady) : null;

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col animate-fluid-in">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 md:py-16 pb-32">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-default/50 pb-10">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Visão Detalhada</p>
            <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none">
              {detailData ? detailData.holding.code || "Ativo" : "Só um segundo..."}
            </h1>
          </div>
          <div className="flex gap-3">
             <Button asChild variant="secondary" className="h-12 px-6 font-bold text-[14px] bg-white border border-border-default shadow-sm hover:bg-bg-secondary">
                <Link to="/app/portfolio">&larr; Voltar à Carteira</Link>
             </Button>
          </div>
        </header>

        {error ? (
          <div className="mt-10">
            <ErrorState
              title="Ops, o papel deu um nó na análise"
              body={error}
              ctaLabel="Voltar ao início"
              ctaTarget="/app/portfolio"
            />
          </div>
        ) : null}

        {!data && !error ? (
          <div className="mt-10">
            <LoadingState title="Abrindo seu dossiê..." body="Estamos analisando os sinais e metas desse ativo." />
          </div>
        ) : isRedirect ? (
          <div className="mt-10">
            <BlockedState
              title="Cofre trancado"
              body="Opa, você precisa terminar seu radar antes de ver os detalhes deste investimento."
              ctaLabel="Continuar agora"
              ctaTarget={normalizeAppTarget(data.redirectTo)}
              secondaryCtaLabel="Voltar"
              secondaryCtaTarget="/app/portfolio"
            />
          </div>
        ) : detailData ? (
          <div className="flex flex-col gap-16">
             
             <section>
               <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                 <h2 className="font-display font-bold text-[32px] md:text-[42px] text-text-primary tracking-tight">{detailData.holding.name}</h2>
                 <span className="text-[14px] font-bold text-text-secondary uppercase tracking-widest bg-bg-secondary px-3 py-1 rounded-full">{detailData.holding.code}</span>
               </div>
               <p className="text-[17px] text-text-secondary mb-10 font-medium">
                  {detailData.holding.platformName ? `Sob custódia na ${detailData.holding.platformName}` : "Sem corretora associada"}
               </p>
               
               <div className="grid grid-cols-2 gap-8 md:gap-16 py-10 border-y border-border-default/50 mb-12">
                  <div>
                     <p className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3">Valor na Carteira</p>
                     <p className="font-display font-bold tabular-nums text-[34px] md:text-[48px] text-text-primary leading-none tracking-tighter">
                        {formatMoney(detailData.holding.currentValue)}
                     </p>
                  </div>
                  <div className="md:border-l md:border-border-default/50 md:pl-16">
                     <p className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3">Peso Total</p>
                     <p className="font-display font-bold tabular-nums text-[34px] md:text-[48px] text-text-primary leading-none tracking-tighter">
                        {detailData.holding.allocationPct != null ? `${detailData.holding.allocationPct.toFixed(2)}%` : "—"}
                     </p>
                  </div>
               </div>
             </section>

             <section className="grid md:grid-cols-2 gap-12">
                {/* Esquerda: Recomendação (Premium Card) */}
                <div className="p-10 border-l-8 border-brand-primary bg-brand-primary/[0.03] rounded-r-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    <p className="text-[13px] font-bold text-brand-primary uppercase tracking-[0.2em]">O que fazer agora</p>
                  </div>
                  <h3 className="font-display font-bold text-[28px] text-text-primary leading-tight mb-4 tracking-tight">{detailData.recommendation.title}</h3>
                  <p className="text-[17px] text-text-secondary leading-relaxed mt-4 font-medium italic">"{detailData.recommendation.body}"</p>
                  
                  <div className="mt-10 flex flex-wrap items-center gap-4">
                     <span className="px-4 py-2 bg-white border border-border-default/60 rounded-xl text-[14px] font-bold text-text-primary shadow-sm">Nível: {detailData.ranking.status}</span>
                     <span className="px-4 py-2 bg-white border border-border-default/60 rounded-xl text-[14px] font-bold text-text-primary shadow-sm tabular-nums flex items-center gap-2">
                        <span className="text-brand-primary">★</span> {detailData.ranking.score}/100
                     </span>
                  </div>
                  
                  {detailData.externalLink ? (
                    <div className="mt-10 pt-6 border-t border-border-default/50">
                      <Button asChild variant="ghost" className="px-0 h-auto font-bold text-brand-primary hover:bg-transparent hover:text-[#D95C24] group">
                        <a href={detailData.externalLink} target="_blank" rel="noreferrer">
                          Ver tese institucional completa <span className="ml-1 group-hover:ml-2 transition-all">&rarr;</span>
                        </a>
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Direita: Signals */}
                <div className="flex flex-col gap-10">
                  <SignalsBlock data={detailData} />
                </div>
             </section>

          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
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

type Signal = { kind: "positive" | "attention"; label: string; body?: string };

function renderSignals(data: HoldingDetailDataReady): Signal[] {
  const res: Signal[] = [];
  const h = data.holding;

  const perf = h.performancePct ?? null;
  if (typeof perf === "number") {
    if (perf > 0.01) {
      res.push({
        kind: "positive",
        label: "Lucro no médio prazo",
        body: `Você já está ganhando ${perf.toFixed(2)}% em cima do que pagou.`,
      });
    } else if (perf < -0.01) {
      res.push({
        kind: "attention",
        label: "Em baixa no preço médio",
        body: `O papel caiu ${Math.abs(perf).toFixed(2)}% desde o seu aporte. Fica de olho.`,
      });
    }
  }

  const alloc = h.allocationPct ?? null;
  if (typeof alloc === "number") {
    if (alloc >= 20) {
      res.push({
        kind: "attention",
        label: "Cuidado com o peso",
        body: `Esse ativo ocupa ${alloc.toFixed(2)}% do seu dinheiro. Muita concentração é arriscado.`,
      });
    } else if (alloc <= 5 && alloc > 0) {
      res.push({
        kind: "positive",
        label: "Peso Seguro",
        body: `O papel ocupa só ${alloc.toFixed(2)}%, mantendo sua carteira bem diversificada.`,
      });
    }
  }

  if (data.ranking.motives.length) {
    const kind: Signal["kind"] = data.ranking.score >= 70 ? "positive" : "attention";
    for (const m of data.ranking.motives.slice(0, 3)) {
      res.push({ kind, label: m });
    }
  }

  if (res.length === 0) {
    res.push({
      kind: "attention",
      label: "Faltam Sinais",
      body: "A gente ainda não tem dados suficientes para te dar sinais técnicos desse ativo.",
    });
  }

  return res;
}

function SignalsBlock({ data }: { data: HoldingDetailDataReady }) {
  const signals = renderSignals(data);
  const positive = signals.filter((s) => s.kind === "positive");
  const attention = signals.filter((s) => s.kind === "attention");

  return (
    <div className="flex flex-col gap-10 w-full px-2">
      <div className="w-full">
        <p className="text-[12px] font-bold text-state-success uppercase tracking-[0.2em] mb-4">Pontos Fortes</p>
        {positive.length ? (
          <ul className="flex flex-col gap-6">
            {positive.map((s) => (
              <li key={`p:${s.label}`} className="pl-6 border-l-2 border-state-success/30">
                <p className="font-bold text-[16px] text-text-primary leading-tight">{s.label}</p>
                {s.body ? <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">{s.body}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-text-secondary opacity-60 italic">Nenhum sinal verde explícito hoje.</p>
        )}
      </div>

      <div className="w-full pt-8 border-t border-border-default/50">
        <p className="text-[12px] font-bold text-state-error uppercase tracking-[0.2em] mb-4">Sinais de Alerta</p>
        {attention.length ? (
          <ul className="flex flex-col gap-6">
            {attention.map((s) => (
              <li key={`a:${s.label}`} className="pl-6 border-l-2 border-state-error/30">
                <p className="font-bold text-[16px] text-text-primary leading-tight">{s.label}</p>
                {s.body ? <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">{s.body}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-text-secondary opacity-60 italic">Tudo correndo normalmente nos parâmetros de risco.</p>
        )}
      </div>
    </div>
  );
}
