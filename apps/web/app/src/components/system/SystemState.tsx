import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type StateAction = {
  label: string;
  target: string;
  variant?: "default" | "secondary";
};

function StateCard({
  kicker,
  title,
  body,
  actions,
  children,
  className = "",
}: {
  kicker: string;
  title: string;
  body: string;
  actions?: StateAction[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-border-default/50 bg-white p-8 shadow-sm animate-fluid-in ${className}`}>
      <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-3">{kicker}</p>
      <h2 className="font-display font-bold text-[28px] text-text-primary tracking-tight leading-tight mb-2">{title}</h2>
      <p className="text-[16px] text-text-secondary leading-relaxed">{body}</p>
      {children ? <div className="mt-6">{children}</div> : null}
      {actions && actions.length ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {actions.map((a) => (
            <Button key={`${a.target}:${a.label}`} asChild variant={a.variant ?? "default"} className="h-12 px-6 font-bold rounded-xl">
              <Link to={a.target}>{a.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LoadingState({
  title = "Só um fôlego...",
  body = "O Esquilo está correndo para buscar seus dados.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fluid-in">
      <div className="w-24 h-24 mb-8 text-brand-primary animate-squirrel-pulse">
        <svg viewBox="0 0 260 220" fill="currentColor">
          <path d="M118 78C118 44, 92 20, 58 20C31 20, 12 36, 12 58C29 50, 45 48, 58 50C72 53, 80 63, 80 79C80 96, 71 107, 58 118C48 126, 42 138, 42 152C42 177, 60 196, 84 202C65 197, 51 181, 51 160C51 148, 56 138, 65 131C80 119, 92 104, 92 81C92 68, 88 57, 80 48C95 54, 106 66, 118 78 Z" />
          <path d="M97 202C77 191, 67 172, 67 149C67 129, 76 111, 92 95L140 47C148 39, 152 29, 152 18C152 9, 158 3, 167 3C175 3, 180 9, 181 17C182 28, 187 37, 197 44C215 56, 228 74, 228 97C228 122, 217 141, 198 154C184 164, 169 169, 152 171L152 183C152 194, 159 202, 170 202L97 202 Z" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-[24px] text-text-primary mb-2">{title}</h3>
      <p className="text-[16px] text-text-secondary">{body}</p>
    </div>
  );
}

export function ErrorState({
  title = "Ih, deu um nó aqui",
  body = "Não consegui falar com o servidor agora.",
  ctaLabel = "Tentar de novo",
  ctaTarget = "/app/home",
  secondaryCtaLabel,
  secondaryCtaTarget,
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaTarget?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTarget?: string;
}) {
  const actions: StateAction[] = [{ label: ctaLabel, target: ctaTarget, variant: "default" }];
  if (secondaryCtaLabel && secondaryCtaTarget) {
    actions.push({
      label: secondaryCtaLabel,
      target: secondaryCtaTarget,
      variant: "secondary",
    });
  }
  const displayBody = humanizeErrorMessage(body);
  return (
    <StateCard kicker="Ops!" title={title} body={displayBody} actions={actions} className="border-state-error/20" />
  );
}

export function EmptyState({
  title = "Tudo limpo por aqui",
  body = "Ainda não encontramos nada para mostrar nessa seção.",
  ctaLabel,
  ctaTarget,
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaTarget?: string;
}) {
  const actions =
    ctaLabel && ctaTarget ? ([{ label: ctaLabel, target: ctaTarget }] satisfies StateAction[]) : undefined;
  return (
    <StateCard kicker="Vazio" title={title} body={body} actions={actions} />
  );
}

export function SuccessState({
  title = "Show de bola!",
  body = "Deu tudo certo com a sua solicitação.",
  ctaLabel,
  ctaTarget,
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaTarget?: string;
}) {
  const actions =
    ctaLabel && ctaTarget ? ([{ label: ctaLabel, target: ctaTarget }] satisfies StateAction[]) : undefined;
  return (
    <StateCard kicker="Sucesso" title={title} body={body} actions={actions} className="border-state-success/20" />
  );
}

export function BlockedState({
  title = "Calma lá, falta um tiquinho",
  body = "A gente precisa de mais algumas infos suas para liberar essa parte.",
  ctaLabel = "Resolver agora",
  ctaTarget = "/app/onboarding",
  secondaryCtaLabel,
  secondaryCtaTarget,
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaTarget?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTarget?: string;
}) {
  const actions: StateAction[] = [{ label: ctaLabel, target: ctaTarget, variant: "default" }];
  if (secondaryCtaLabel && secondaryCtaTarget) {
    actions.push({
      label: secondaryCtaLabel,
      target: secondaryCtaTarget,
      variant: "secondary",
    });
  }
  return <StateCard kicker="Bloqueado" title={title} body={body} actions={actions} />;
}

export function InsufficientDataState({
  title = "Tá faltando dado na mesa",
  body = "Com um pouco mais de informação a gente consegue te dar uma visão melhor.",
  ctaLabel,
  ctaTarget,
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaTarget?: string;
}) {
  return <EmptyState title={title} body={body} ctaLabel={ctaLabel} ctaTarget={ctaTarget} />;
}

export function ConfirmState({
  title = "Dá uma conferida",
  body = "Veja se está tudo certinho antes de a gente seguir.",
  primaryAction,
  secondaryAction,
}: {
  title?: string;
  body?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  return (
    <StateCard kicker="Confirmação" title={title} body={body}>
      <div className="flex flex-wrap gap-3">
        {primaryAction ?? null}
        {secondaryAction ?? null}
      </div>
    </StateCard>
  );
}

function humanizeErrorMessage(body: string) {
  const raw = (body ?? "").trim();
  if (!raw) return "Ih, deu um branco no sistema. Tenta recarregar para a gente ver o que houve?";

  const s = raw.toLowerCase();
  
  // Problemas de Conexão/Rede
  if (
    s.includes("typeerror") ||
    s.includes("failed to fetch") ||
    s.includes("networkerror") ||
    s.includes("econn") ||
    s.includes("timeout") ||
    s.includes("fetch")
  ) {
    return "Eita, parece que a internet deu uma escapada. Dá uma olhada no seu sinal e tenta de novo!";
  }

  // Acesso e Autenticação
  if (s.includes("unauthorized") || s.includes("forbidden") || s.includes("401") || s.includes("403") || s.includes("sessao") || s.includes("login")) {
    return "Opa, sua entrada no app expirou ou você não tem a 'chave' dessa porta. Tenta entrar de novo?";
  }

  // Não Encontrado
  if (s.includes("not found") || s.includes("nao encontrado") || s.includes("404")) {
    return "Vixe, procurei em todo canto mas esse dado sumiu. Ele mudou de lugar ou foi apagado?";
  }

  // Erro de Servidor / Banco
  if (s.includes("500") || s.includes("sql") || s.includes("d1") || s.includes("database") || s.includes("server error")) {
    return "Ih, nossos servidores estão fazendo hora extra e se cansaram. Tenta de novo em um minutinho?";
  }

  // Validação Genérica
  if (s.includes("invalid") || s.includes("invalido") || s.includes("wrong")) {
    return "Opa, essa informação não tá batendo com o que eu esperava. Dá uma conferida nos campos?";
  }

  // Se não bater com nada, coloca um prefixo da marca
  return `Vixe, aconteceu algo inesperado: ${raw}. Tenta de novo?`;
}
