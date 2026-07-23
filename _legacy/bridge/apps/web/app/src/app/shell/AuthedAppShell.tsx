import * as React from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useDataSources } from "@/core/data/react";
import { useAppStore } from "@/core/state/app_store";
import { LoadingState, ErrorState } from "@/components/system/SystemState";
import { AppShell } from "@/app/shell/AppShell";

/**
 * Release 0.1: bloqueia uso anonimo. Se nao houver sessao, manda para /login.
 * Mantem o backend como fonte unica de verdade (GET /v1/auth/session).
 */
export function AuthedAppShell() {
  const ds = useDataSources();
  const store = useAppStore();
  const nav = useNavigate();
  const location = useLocation();

  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready" }
  >({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await ds.auth.getSession();
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "error", message: res.error.message });
          return;
        }

        if (!res.data.authenticated) {
          nav("/login", { replace: true, state: { from: location.pathname } });
          return;
        }

        store.setState((s) => ({
          ...s,
          session: { status: "authenticated", identity: { userId: (res.data as any).userId } },
        }));

        setState({ kind: "ready" });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", message: e instanceof Error ? e.message : "Falha ao validar sessão." });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // Intencionalmente nao depende de location.pathname:
    // revalidar sessao a cada clique degrada muito UX (mais latencia e mais requests).
    // Se a sessao expirar, as chamadas /v1/* vao retornar 401 e o app redireciona.
  }, [ds, nav, store]);

  if (state.kind === "loading") {
    return (
      <div className="min-h-dvh bg-bg-secondary text-text-primary px-4 py-10 flex items-center justify-center">
        <LoadingState title="Validando sua sessão" body="Só um instante." />
      </div>
    );
  }

  if (state.kind === "error") {
    // Dispara o modal caso ainda não esteja aberto (evita loops se renderizar de novo)
    const currentStore = store.getState();
    if (!currentStore.ui.errorModal.isOpen) {
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          errorModal: {
            isOpen: true,
            title: "Não consegui validar sua sessão",
            body: state.message,
            ctaLabel: "Ir para login",
            ctaTarget: "/login",
          },
        },
      }));
    }

    return (
      <div className="min-h-dvh bg-bg-secondary text-text-primary flex items-center justify-center p-10">
         <div className="text-center opacity-50">
            <p className="text-[14px] font-bold uppercase tracking-widest mb-2">Sessão Suspensa</p>
            <p className="text-[13px]">Verifique o alerta na tela.</p>
         </div>
      </div>
    );
  }

  // Usa o layout existente, mas garante sessao antes.
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

