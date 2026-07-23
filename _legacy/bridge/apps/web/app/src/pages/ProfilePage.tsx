import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import type { ProfileContextPayload } from "@/core/data/contracts";
import { ErrorState, LoadingState, SuccessState } from "@/components/system/SystemState";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/system/BottomNav";

export function ProfilePage() {
  const ds = useDataSources();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [context, setContext] = React.useState<ProfileContextPayload>({
    financialGoal: null,
    monthlyIncomeRange: null,
    monthlyInvestmentTarget: null,
    availableToInvest: null,
    riskProfileSelfDeclared: null,
    riskProfileQuizResult: null,
    riskProfileEffective: null,
    investmentHorizon: null,
    platformsUsed: null,
    displayPreferences: { ghostMode: false },
  });

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await ds.profile.getProfileContext();
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error.message);
          setLoading(false);
          return;
        }
        setContext(res.data.context);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Vixe, deu um erro ao carregar seu perfil. Tenta atualizar?");
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [ds]);

  async function onSave() {
    setSaved(false);
    setError(null);
    try {
      const res = await ds.profile.putProfileContext({
        step: "income_horizon",
        context: {
          monthlyIncomeRange: context.monthlyIncomeRange,
          monthlyInvestmentTarget: context.monthlyInvestmentTarget,
          availableToInvest: context.availableToInvest,
        },
      });
      if (!res.ok) {
        setError(res.error.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 5000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eita, deu erro ao salvar seu contexto. Tenta de novo?");
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg-primary">
        <LoadingState title="Preparando seu dossiê..." body="Estamos organizando suas preferências." />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col animate-fluid-in">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 md:py-16 pb-32">
        <header className="mb-12 border-b border-border-default/50 pb-10">
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-2">Central de Perfil</p>
          <h1 className="font-display font-bold text-[38px] md:text-[52px] text-text-primary tracking-tighter leading-none mb-4">
            Seu Contexto
          </h1>
          <p className="text-[17px] text-text-secondary leading-relaxed max-w-2xl">
            É aqui que a gente calibra o robô. Com essas informações, o Esquilo Invest consegue entender se um risco vale a pena pra você ou se é melhor pisar no freio.
          </p>
        </header>

        {error ? (
          <div className="mb-10">
            <ErrorState
              title="A linha do perfil deu um nó"
              body={error}
              ctaLabel="Recarregar página"
              ctaTarget="/app/profile"
            />
          </div>
        ) : null}

        {saved ? (
          <div className="mb-10 p-6 bg-state-success/10 border-l-4 border-state-success rounded-r-xl">
             <p className="text-[14px] font-bold text-state-success uppercase tracking-wide mb-1">Perfil Atualizado!</p>
             <p className="text-[16px] text-text-secondary">Seu Esquilo agora está mais esperto e alinhado com seu momento.</p>
          </div>
        ) : null}

        <div className="grid gap-16 md:grid-cols-[1fr_300px]">
          
          {/* Coluna Principal: Edição */}
          <div className="flex flex-col gap-12">
             <section>
                <h3 className="font-display font-bold text-[24px] text-text-primary mb-8 tracking-tight">Capacidade Financeira</h3>
                <div className="grid gap-8 md:grid-cols-2">
                   <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest pl-1">Renda mensal (faixa)</label>
                      <select
                        className="h-14 w-full rounded-2xl border-2 border-border-default bg-white px-5 text-[16px] font-medium outline-none focus:border-brand-primary transition-all"
                        value={context.monthlyIncomeRange ?? ""}
                        onChange={(e) =>
                          setContext((c) => ({ ...c, monthlyIncomeRange: e.target.value || null }))
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="0-5k">R$ 0 - 5k</option>
                        <option value="5k-10k">R$ 5k - 10k</option>
                        <option value="10k-15k">R$ 10k - 15k</option>
                        <option value="15k-25k">R$ 15k - 25k</option>
                        <option value="25k+">Acima de R$ 25k</option>
                      </select>
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest pl-1">Meta de aporte (mês)</label>
                      <div className="relative">
                         <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-text-disabled">R$</span>
                         <Input
                           className="h-14 pl-12 rounded-2xl border-2 border-border-default bg-white text-[18px] font-display font-bold tabular-nums"
                           placeholder="Ex: 1200"
                           inputMode="numeric"
                           value={context.monthlyInvestmentTarget ?? ""}
                           onChange={(e) =>
                             setContext((c) => ({
                               ...c,
                               monthlyInvestmentTarget: e.target.value ? Number(e.target.value) : null,
                             }))
                           }
                         />
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest pl-1">Disponível para investir agora</label>
                       <div className="relative">
                         <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-text-disabled">R$</span>
                         <Input
                           className="h-14 pl-12 rounded-2xl border-2 border-border-default bg-white text-[18px] font-display font-bold tabular-nums"
                           placeholder="Ex: 5000"
                           inputMode="numeric"
                           value={context.availableToInvest ?? ""}
                           onChange={(e) =>
                             setContext((c) => ({
                               ...c,
                               availableToInvest: e.target.value ? Number(e.target.value) : null,
                             }))
                           }
                         />
                      </div>
                      <p className="text-[12px] text-text-disabled mt-2 px-1 italic">
                        Quanto você tem guardado "embaixo do colchão" esperando uma dica do Esquilo?
                      </p>
                   </div>
                </div>
             </section>

             <section className="pt-8 border-t border-border-default/50">
               <div className="flex items-center gap-4">
                  <Button onClick={onSave} className="h-14 px-10 bg-brand-primary hover:bg-[#D95C24] text-white font-bold text-[16px] rounded-2xl shadow-xl shadow-brand-primary/10 transition-transform active:scale-95">
                    Salvar Alterações
                  </Button>
                  <Button variant="ghost" onClick={() => window.location.reload()} className="h-14 px-6 text-text-secondary font-bold hover:bg-bg-secondary rounded-2xl">
                    Descartar
                  </Button>
               </div>
             </section>
          </div>

          {/* Coluna Sidebar: Resumo / Info */}
          <div className="flex flex-col gap-10">
             <div className="p-8 bg-white border border-border-default/50 rounded-3xl shadow-sm">
                <h4 className="font-display font-bold text-[20px] text-text-primary mb-6">Status Atual</h4>
                <div className="flex flex-col gap-6">
                   <div className="bg-bg-secondary/40 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Objetivo Definido</p>
                      <p className="text-[15px] font-bold text-text-primary leading-tight">{context.financialGoal ? translateGoal(context.financialGoal) : "Não definido"}</p>
                   </div>
                   <div className="bg-bg-secondary/40 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Horizonte de Espera</p>
                      <p className="text-[15px] font-bold text-text-primary leading-tight">{context.investmentHorizon ? translateHorizon(context.investmentHorizon) : "Não definido"}</p>
                   </div>
                   <div className="bg-bg-secondary/40 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Plataformas</p>
                      <p className="text-[15px] font-bold text-text-primary leading-tight">
                        {context.platformsUsed?.platformIds?.length
                          ? context.platformsUsed.platformIds.map(p => p.toUpperCase()).join(", ")
                          : "Nenhuma selecionada"}
                      </p>
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border-default/50">
                  <Button asChild variant="ghost" className="px-0 h-auto text-brand-primary font-bold hover:bg-transparent hover:text-[#D95C24] group">
                    <Link to="/app/onboarding">Refazer Jornada de Perfil <span className="ml-1 group-hover:ml-2 transition-all">&rarr;</span></Link>
                  </Button>
                </div>
             </div>

             <div className="p-6 bg-brand-primary/[0.03] rounded-2xl border border-brand-primary/10">
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  <strong>Dica:</strong> Manter esses dados atualizados ajuda nosso motor de IA a não sugerir ativos arrojados demais se você tiver um horizonte curto.
                </p>
             </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}

function translateGoal(g: string) {
  const map: Record<string, string> = {
    equilibrar_e_crescer: "🎯 Equilibrar e crescer",
    reduzir_risco: "🛡️ Reduzir Risco",
    aposentadoria: "🏝️ Aposentadoria",
  };
  return map[g] || g;
}

function translateHorizon(h: string) {
  const map: Record<string, string> = {
    curto_prazo: "⌛ Curto Prazo",
    medio_prazo: "⏳ Médio Prazo",
    longo_prazo: "🏔️ Longo Prazo",
  };
  return map[h] || h;
}
