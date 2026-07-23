import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import type { ProfileContextPayload, ProfileContextStep } from "@/core/data/contracts";
import { ErrorState, InsufficientDataState, LoadingState } from "@/components/system/SystemState";

export function OnboardingPage() {
  const ds = useDataSources();
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<ProfileContextStep>("goal");
  const [context, setContext] = React.useState<ProfileContextPayload | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [started, setStarted] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await ds.profile.getProfileContext();
      if (!res.ok) {
        setError(res.error.message);
        setLoading(false);
        return;
      }
      setContext(res.data.context);
      setStep((res.data.onboarding.currentStep as ProfileContextStep) ?? "goal");
      if (res.data.onboarding.completedSteps?.length) setStarted(true);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vixe, deu um erro ao buscar seu perfil. Tenta de novo!");
      setLoading(false);
    }
  }, [ds]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save(nextStep?: ProfileContextStep) {
    if (!context) return;
    setSaving(true);
    setError(null);
    try {
      const res = await ds.profile.putProfileContext({
        step: nextStep ?? step,
        context,
      });
      if (!res.ok) {
        setError(res.error.message);
      } else {
        await load();
        if (res.data.onboarding.homeUnlocked) {
          nav("/app/home", { replace: true });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eita, deu erro ao salvar. Tenta mais uma vez?");
    } finally {
      setSaving(false);
    }
  }

  const stepsOrder: ProfileContextStep[] = ["goal", "risk_quiz", "income_horizon", "platforms"];
  const currentStepIndex = stepsOrder.indexOf(step);
  const progress = ((currentStepIndex + 1) / stepsOrder.length) * 100;

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg-primary">
        <LoadingState title="Arrumando a casa..." body="Só um instante enquanto preparamos seu Radar." />
      </div>
    );
  }

  if (!started && step === "goal") {
    return (
      <div className="min-h-dvh flex flex-col bg-bg-primary">
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-[40px] mb-8">🐿️</div>
          <p className="text-[14px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">Bem-vindo ao Esquilo</p>
          <h1 className="font-display font-bold text-[42px] md:text-[56px] text-text-primary tracking-tighter leading-[1.1] mb-6">
            Vamos calibrar seu Radar?
          </h1>
          <p className="text-[18px] text-text-secondary leading-relaxed mb-12">
            Pra gente te dar recomendações que façam sentido, precisamos entender um pouquinho do seu momento. É rápido, sem burocracia e você pode mudar tudo depois.
          </p>
          
          <div className="grid gap-6 w-full sm:flex sm:items-center sm:justify-center">
             <Button onClick={() => setStarted(true)} className="h-16 px-12 bg-brand-primary hover:bg-[#D95C24] text-white font-bold text-[18px] rounded-2xl shadow-xl shadow-brand-primary/20 transition-transform active:scale-95">
                Bora lá!
             </Button>
             <Button asChild variant="ghost" className="h-16 px-8 text-text-secondary font-bold text-[16px] hover:bg-bg-secondary rounded-2xl">
                <Link to="/app/home">Pular por agora</Link>
             </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 text-left border-t border-border-default/50 pt-10">
             <div>
                <p className="font-bold text-text-primary text-[15px] mb-1">🎯 Objetivo</p>
                <p className="text-[13px] text-text-secondary leading-snug">O que você quer com seu dinheiro?</p>
             </div>
             <div>
                <p className="font-bold text-text-primary text-[15px] mb-1">⚖️ Risco</p>
                <p className="text-[13px] text-text-secondary leading-snug">Até onde você topa ir?</p>
             </div>
             <div>
                <p className="font-bold text-text-primary text-[15px] mb-1">🏦 Fontes</p>
                <p className="text-[13px] text-text-secondary leading-snug">Onde você costuma investir?</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary animate-fluid-in">
      {/* Barra de Progresso */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-brand-primary/10 z-[60]">
         <div className="h-full bg-brand-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center pt-24 pb-32 max-w-xl mx-auto px-6 w-full">
        <header className="text-center mb-12 w-full">
          <p className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-3">
            Passo {currentStepIndex + 1} de {stepsOrder.length}
          </p>
          <h1 className="font-display font-bold text-[36px] text-text-primary tracking-tight leading-tight">
            {stepTitle(step)}
          </h1>
        </header>

        {error ? (
          <div className="mb-10 w-full">
            <ErrorState
              title="Vixe, algo deu errado"
              body={error}
              ctaLabel="Tentar de novo"
              ctaTarget="/app/onboarding"
            />
          </div>
        ) : null}

        <main className="w-full">
          {!context ? (
            <InsufficientDataState
              title="Sem dados de contexto"
              body="Não conseguimos carregar suas opções. Tenta recarregar a página!"
              ctaLabel="Recarregar"
              ctaTarget="/app/onboarding"
            />
          ) : (
            <>
              <div className="min-h-[300px]">
                {step === "goal" ? (
                  <GoalStep
                    value={context.financialGoal}
                    onChange={(v) => setContext((c) => (c ? { ...c, financialGoal: v } : c))}
                  />
                ) : null}

                {step === "risk_quiz" ? (
                  <RiskStep
                    value={context.riskProfileQuizResult}
                    onChange={(v) =>
                      setContext((c) => (c ? { ...c, riskProfileQuizResult: v, riskProfileEffective: v } : c))
                    }
                  />
                ) : null}

                {step === "income_horizon" ? (
                  <IncomeStep
                    incomeRange={context.monthlyIncomeRange}
                    horizon={context.investmentHorizon}
                    onChange={(patch) =>
                      setContext((c) => (c ? { ...c, ...patch } : c))
                    }
                  />
                ) : null}

                {step === "platforms" ? (
                  <PlatformsStep
                    value={context.platformsUsed?.platformIds ?? []}
                    onChange={(platformIds) =>
                      setContext((c) =>
                        c
                          ? {
                              ...c,
                              platformsUsed: { platformIds, otherPlatforms: [] },
                            }
                          : c,
                      )
                    }
                  />
                ) : null}
              </div>

              <div className="mt-16 flex flex-col gap-4">
                <Button
                  onClick={() => save(nextStep(step))}
                  disabled={saving}
                  className="h-16 bg-brand-primary hover:bg-[#D95C24] text-white font-bold text-[18px] rounded-2xl shadow-lg shadow-brand-primary/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : step === "platforms" ? "Concluir!" : "Continuar →"}
                </Button>
                
                <div className="flex items-center justify-between mt-2">
                  {step !== "goal" ? (
                    <button
                      type="button"
                      onClick={() => setStep(prevStep(step))}
                      disabled={saving}
                      className="text-[14px] font-bold text-text-secondary hover:text-text-primary p-2 transition-colors disabled:opacity-30"
                    >
                      &larr; Voltar
                    </button>
                  ) : <div />}

                  <Link to="/app/home" className="text-[14px] font-bold text-text-disabled hover:text-text-secondary p-2 transition-colors">
                    Pular por agora
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function stepTitle(step: ProfileContextStep) {
  if (step === "goal") return "Qual seu plano para esse dinheiro?";
  if (step === "risk_quiz") return "Até onde você topa oscilar?";
  if (step === "income_horizon") return "Renda e tempo de espera";
  if (step === "platforms") return "Onde você já investe?";
  return "Personalizando seu App";
}

function nextStep(step: ProfileContextStep): ProfileContextStep {
  if (step === "goal") return "risk_quiz";
  if (step === "risk_quiz") return "income_horizon";
  if (step === "income_horizon") return "platforms";
  return "platforms";
}

function prevStep(step: ProfileContextStep): ProfileContextStep {
  if (step === "platforms") return "income_horizon";
  if (step === "income_horizon") return "goal";
  if (step === "risk_quiz") return "goal";
  return "goal";
}

function GoalStep({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const options = [
    { key: "equilibrar_e_crescer", label: "Equilibrar e crescer", desc: "Pra quem quer segurança sem abrir mão de um ganho real.", icon: "🎯" },
    { key: "reduzir_risco", label: "Reduzir risco", desc: "Foco total em preservar o que você já conquistou.", icon: "🛡️" },
    { key: "aposentadoria", label: "Aposentadoria", desc: "Longa jornada focado em viver de renda no futuro.", icon: "🏝️" },
  ];

  return (
    <div className="grid gap-4">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-6 p-6 text-left rounded-2xl border-2 transition-all active:scale-[0.98] ${
            value === o.key 
              ? "border-brand-primary bg-brand-primary/[0.03] shadow-md" 
              : "border-border-default bg-white hover:border-brand-primary/50"
          }`}
        >
          <span className="text-[32px]">{o.icon}</span>
          <div>
            <p className="font-bold text-[18px] text-text-primary leading-tight">{o.label}</p>
            <p className="text-[14px] text-text-secondary mt-1">{o.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function RiskStep({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const options = [
    { key: "conservador", label: "Conservador", desc: "Prefiro dormir tranquilo, mesmo que ganhe menos.", color: "bg-state-success" },
    { key: "moderado", label: "Moderado", desc: "Top alguma oscilação para buscar um ganho melhor.", color: "bg-brand-primary" },
    { key: "arrojado", label: "Arrojado", desc: "Oscilação faz parte, eu quero é o maior retorno possível.", color: "bg-state-error" },
  ];

  return (
    <div className="grid gap-4">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-6 p-6 text-left rounded-2xl border-2 transition-all active:scale-[0.98] ${
            value === o.key 
              ? "border-brand-primary bg-brand-primary/[0.03] shadow-md" 
              : "border-border-default bg-white hover:border-brand-primary/50"
          }`}
        >
          <div className={`w-3 h-12 rounded-full ${o.color}`} />
          <div>
            <p className="font-bold text-[18px] text-text-primary leading-tight">{o.label}</p>
            <p className="text-[14px] text-text-secondary mt-1">{o.desc}</p>
          </div>
        </button>
      ))}
      <p className="text-[12px] text-text-disabled mt-4 text-center px-4 italic">
        *A gente não vai fazer compras pra você, só vamos ajustar as recomendações do robô.
      </p>
    </div>
  );
}

function IncomeStep({
  incomeRange,
  horizon,
  onChange,
}: {
  incomeRange: string | null;
  horizon: string | null;
  onChange: (patch: { monthlyIncomeRange?: string | null; investmentHorizon?: string | null }) => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest pl-1">Sua renda mensal aprox.</label>
        <div className="grid grid-cols-2 gap-3">
           {["0-5k", "5k-10k", "10k-15k", "15k-25k", "25k+"].map(range => (
             <button
               key={range}
               type="button"
               onClick={() => onChange({ monthlyIncomeRange: range })}
               className={`h-14 rounded-xl border-2 font-bold text-[15px] transition-all ${
                 incomeRange === range ? "border-brand-primary bg-brand-primary/[0.03] text-brand-primary" : "border-border-default bg-white text-text-secondary"
               }`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest pl-1">Quanto tempo quer esperar?</label>
        <div className="grid grid-cols-1 gap-3">
           {[
             { key: "curto_prazo", label: "Curto (até 2 anos)", desc: "Pra quem precisa de liquidez logo." },
             { key: "medio_prazo", label: "Médio (2 a 5 anos)", desc: "Equilíbrio entre tempo e ganho." },
             { key: "longo_prazo", label: "Longo (5 anos+)", desc: "Focado em grandes crescimentos." }
           ].map(h => (
             <button
               key={h.key}
               type="button"
               onClick={() => onChange({ investmentHorizon: h.key })}
               className={`flex items-baseline justify-between p-5 rounded-xl border-2 transition-all ${
                 horizon === h.key ? "border-brand-primary bg-brand-primary/[0.03]" : "border-border-default bg-white"
               }`}
             >
               <span className={`font-bold text-[16px] ${horizon === h.key ? "text-brand-primary" : "text-text-primary"}`}>{h.label}</span>
               <span className="text-[12px] text-text-secondary">{h.desc}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}

function PlatformsStep({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const options = [
    { key: "xp", label: "XP", icon: "💎" },
    { key: "ion", label: "Íon Itaú", icon: "🏦" },
    { key: "nubank", label: "Nubank", icon: "💜" },
    { key: "btg", label: "BTG", icon: "🟦" },
  ];

  function toggle(k: string) {
    const next = value.includes(k) ? value.filter((x) => x !== k) : [...value, k];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] text-text-secondary text-center px-4 mb-4">
        Marque os locais onde você tem conta investindo hoje. Isso ajuda a calibrar a importação automática.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => toggle(o.key)}
            className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 transition-all shadow-sm ${
              value.includes(o.key) 
                ? "border-brand-primary bg-brand-primary/[0.03] scale-[1.02]" 
                : "border-border-default bg-white hover:border-brand-primary/30"
            }`}
          >
            <span className="text-[32px]">{o.icon}</span>
            <span className={`font-bold text-[16px] ${value.includes(o.key) ? "text-brand-primary" : "text-text-primary"}`}>{o.label}</span>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${value.includes(o.key) ? "bg-brand-primary border-brand-primary" : "border-border-default"}`}>
              {value.includes(o.key) && <span className="text-white text-[10px]">✓</span>}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 p-4 bg-bg-secondary/50 rounded-xl text-center">
         <p className="text-[13px] text-text-secondary font-medium">Não achou sua corretora? Pode marcar as principais que depois você adiciona as outras no perfil.</p>
      </div>
    </div>
  );
}
