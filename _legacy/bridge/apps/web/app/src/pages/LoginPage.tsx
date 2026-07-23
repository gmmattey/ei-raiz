import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { useDataSources } from "@/core/data/react";
import { useAppStore } from "@/core/state/app_store";
import { EyeIcon, EyeOffIcon } from "@/components/system/Icons";

// Helper: Mask CPF
function maskCPF(value: string) {
  const v = value.replace(/\D/g, "");
  return v.replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function LoginPage() {
  const ds = useDataSources();
  const store = useAppStore();
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberDevice, setRememberDevice] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  // Logic to dynamically mask if user is typing numbers
  function handleIdentifierChange(e: React.ChangeEvent<HTMLInputElement>) {
     const val = e.target.value;
     if (!val) { setIdentifier(""); return; }
     
     // If first char is a number, we assume CPF
     if (/^\d/.test(val)) {
        setIdentifier(maskCPF(val).slice(0, 14));
     } else {
        setIdentifier(val.toLowerCase());
     }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend mapping: if identifier starts with digit, it's CPF, remove dots
      const finalId = /^\d/.test(identifier) ? identifier.replace(/\D/g, "") : identifier;
      
      const res = await ds.auth.login({ identifier: finalId, password, rememberDevice });
      if (!res.ok) {
        store.setState((s) => ({
          ...s,
          ui: {
            ...s.ui,
            errorModal: {
              isOpen: true,
              title: "Não consegui entrar",
              body: res.error.message,
              ctaLabel: "Tentar de novo",
            },
          },
        }));
        return;
      }

      const next = normalizeAppTarget(res.data.nextStep);
      nav(from ?? next, { replace: true });
    } catch (e2) {
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          errorModal: {
            isOpen: true,
            title: "Ih, deu um nó na conexão",
            body: e2 instanceof Error ? e2.message : "Eita, não conseguimos te conectar agora. Dá uma espiada se a internet tá boa e tenta de novo.",
            ctaLabel: "Vou conferir",
          },
        },
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col px-6 md:px-0 animate-fluid-in">
      
      {/* App Bar (Botão Voltar) */}
      <div className="w-full h-16 flex items-center border-b border-border-default md:px-12 mb-8 md:mb-12">
         <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary font-bold -ml-4 px-4 hidden md:flex">
            <Link to="/">&larr; Voltar à página inicial</Link>
         </Button>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-8 pb-20">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
             <Logo className="h-8 w-auto text-brand-primary" />
             <Button variant="ghost" asChild className="md:hidden text-text-secondary">
               <Link to="/">&larr; Voltar</Link>
             </Button>
          </div>
          <h1 className="font-display font-bold text-[32px] tracking-tight">Acesso ao Cofre</h1>
          <p className="text-[15px] text-text-secondary pb-4 border-b border-border-default">
            Acesse sua conta com seu E-mail ou CPF para gerenciar sua carteira.
          </p>
        </header>

        <section>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary block">CPF ou E-mail</label>
              <input
                className="w-full rounded-md border border-border-default bg-white px-4 py-3.5 text-[15px] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors shadow-sm"
                value={identifier}
                onChange={handleIdentifierChange}
                autoComplete="username"
                placeholder="000.000.000-00 ou nome@provedor.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                 <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary">Sua Senha</label>
                 <Link to="/forgot-password" className="text-[12px] font-bold text-brand-primary hover:underline hover:text-[#D95C24] mb-0.5">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-md border border-border-default bg-white pl-4 pr-16 py-3.5 text-[15px] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Insira sua senha secreta"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-text-secondary hover:text-brand-primary hover:bg-bg-secondary transition-all"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mt-2">
               <div className="relative flex items-start mt-0.5">
                  <input type="checkbox" className="peer sr-only" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} disabled={loading} />
                  <div className="w-[20px] h-[20px] border-2 border-border-default rounded flex items-center justify-center peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-colors">
                     {rememberDevice && <span className="text-white text-[12px] font-bold">✓</span>}
                  </div>
               </div>
               <div>
                 <p className="text-[14px] font-semibold text-text-primary group-hover:text-brand-primary transition-colors">Manter sessão salva</p>
                 <p className="text-[13px] text-text-secondary">Não use em computadores públicos.</p>
               </div>
            </label>

            <div className="pt-6 border-t border-border-default">
              <Button
                type="submit"
                className="w-full h-[60px] text-[16px] font-bold bg-brand-primary hover:bg-[#D95C24] text-white shadow-lg transition-transform active:scale-[0.98]"
                isLoading={loading}
                loadingLabel="Autenticando cofre..."
                disabled={!identifier.trim() || !password}
              >
                Acessar Plataforma Mestra
              </Button>
            </div>

            <p className="text-center text-[14px] text-text-secondary pt-4">
              Ainda não é membro? <Link className="font-bold text-brand-primary hover:underline hover:text-[#D95C24]" to="/register">Desvende sua carteira aqui</Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}
