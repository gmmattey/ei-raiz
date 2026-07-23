import * as React from "react";
import { useNavigate } from "react-router-dom";
import { getDataSources } from "@/core/data";
import { useAppStore } from "@/core/state/app_store";

export function StartPage() {
  const nav = useNavigate();
  const store = useAppStore();
  const [status, setStatus] = React.useState<"loading" | "error">("loading");

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const ds = getDataSources();
        const res = await ds.auth.getSession();

        if (!cancelled) {
          if (res.ok) {
            if (!res.data.authenticated) {
              nav("/login", { replace: true });
              return;
            }

            store.setState((s) => ({
              ...s,
              session: {
                status: "authenticated",
                identity: { userId: (res.data as any).userId },
              },
            }));

            // Fonte de verdade: backend decide se vai para /home ou /onboarding.
            nav(normalizeAppTarget((res.data as any).nextStep || "/home"), { replace: true });
            return;
          }
        }
      } catch {
        // Release 0.1: falha aqui bloqueia, porque nao existe modo anonimo.
      }

      if (!cancelled) {
        setStatus("error");
        nav("/login", { replace: true });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [nav, store]);

  return (
    <div className="min-h-dvh bg-bg-secondary text-text-primary">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 py-14">
        <p className="ty-caption text-text-secondary">Início</p>
        <h1 className="ty-h1 font-display">
          {status === "loading" ? "Preparando seu panorama" : "Abrindo…"}
        </h1>
        <p className="ty-body text-text-secondary">
          Validando sua sessão para liberar o app.
        </p>
      </div>
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}
