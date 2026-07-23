import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { useDataSources } from "@/core/data/react";
import { useAppStore } from "@/core/state/app_store";
import { EyeIcon, EyeOffIcon } from "@/components/system/Icons";

// Helper: CPF Modulo-11
function validateCPF(cpfRaw: string) {
  const c = cpfRaw.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(c.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(c.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(c.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(c.substring(10, 11))) return false;
  return true;
}

// Helper: Mask CPF
function maskCPF(value: string) {
  const v = value.replace(/\D/g, "");
  return v.replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Helper: Mask Phone
function maskPhone(value: string) {
  const v = value.replace(/\D/g, "");
  if (v.length <= 10) {
     return v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

// Helper: Capitalize Name
function capitalizeName(name: string) {
  return name.replace(/\b\w/g, l => l.toUpperCase());
}

export function RegisterPage() {
  const ds = useDataSources();
  const store = useAppStore();
  const nav = useNavigate();

  const [cpf, setCpf] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [optMessages, setOptMessages] = React.useState(true);
  const [optEmail, setOptEmail] = React.useState(true);
  const [showRecoveryAlert, setShowRecoveryAlert] = React.useState(false);

  const [loading, setLoading] = React.useState(false);

  // Validations
  const cpfValid = cpf.length > 0 ? validateCPF(cpf) : null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = email.length > 0 ? emailRegex.test(email) : null;
  
  const pwdReqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
  const passwordValid = Object.values(pwdReqs).every(v => v === true);

  const [emailSugs, setEmailSugs] = React.useState<string[]>([]);
  React.useEffect(() => {
     if (email.length > 0 && !email.includes("@")) {
       setEmailSugs(["gmail.com", "hotmail.com", "outlook.com", "icloud.com"].map(d => `${email}@${d}`));
     } else {
       setEmailSugs([]);
     }
  }, [email]);

  function handleMessageOptIn(checked: boolean) {
    setOptMessages(checked);
    if (!checked) setShowRecoveryAlert(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await ds.auth.register({
        cpf: cpf.replace(/\D/g, ""),
        email,
        displayName,
        password,
        confirmPassword: password,
        rememberDevice: true,
      });
      if (!res.ok) {
        store.setState((s) => ({
          ...s,
          ui: {
            ...s.ui,
            errorModal: {
              isOpen: true,
              title: "Ops, algo deu errado",
              body: res.error.message,
              ctaLabel: "Tentar de novo",
            },
          },
        }));
        return;
      }
      nav(normalizeAppTarget(res.data.nextStep), { replace: true });
    } catch (e2) {
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          errorModal: {
            isOpen: true,
            title: "Ih, deu um nó no registro",
            body: e2 instanceof Error ? e2.message : "Deu um pequeno tropeço na hora de abrir sua conta. Pode tentar de novo?",
            ctaLabel: "Vou conferir",
          },
        },
      }));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = cpfValid && emailValid && displayName.trim().length >= 3 && passwordValid && phone.replace(/\D/g, "").length >= 10;

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col px-6 md:px-0 animate-fluid-in">
      
      {/* App Bar (Botão Voltar) */}
      <div className="w-full h-16 flex items-center border-b border-border-default md:px-12 mb-8 md:mb-12">
         <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary font-bold -ml-4 px-4 hidden md:flex">
            <Link to="/">&larr; Voltar à página inicial</Link>
         </Button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pb-20">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
             <Logo className="h-8 w-auto text-brand-primary" />
             <Button variant="ghost" asChild className="md:hidden text-text-secondary">
               <Link to="/">&larr; Voltar</Link>
             </Button>
          </div>
          <h1 className="font-display font-bold text-[32px] tracking-tight">Criar Conta</h1>
          <p className="text-[15px] text-text-secondary pb-4 border-b border-border-default">
            Crie seu cofre em segundos e analise toda a sua vida financeira sem intermediários.
          </p>
        </header>

        <section>
          <form className="space-y-6" onSubmit={onSubmit}>
            
            <div className="space-y-2">
              <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary block">Nome Completo</label>
              <input
                className="w-full rounded-md border border-border-default bg-white px-4 py-3.5 text-[15px] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors shadow-sm"
                value={displayName}
                onChange={(e) => setDisplayName(capitalizeName(e.target.value))}
                autoComplete="name"
                placeholder="Seu nome civil"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary flex justify-between">
                <span>CPF</span>
                {cpfValid === false && <span className="text-state-error normal-case font-semibold text-[12px]">CPF tá meio estranho...</span>}
                {cpfValid === true && <span className="text-state-success normal-case font-semibold text-[12px]">Tudo certo!</span>}
              </label>
              <input
                className={`w-full rounded-md border px-4 py-3.5 text-[15px] focus:outline-none focus:ring-1 transition-colors shadow-sm ${cpfValid === false ? 'border-state-error focus:ring-state-error bg-state-error/5' : 'border-border-default bg-white focus:border-brand-primary focus:ring-brand-primary'}`}
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                maxLength={14}
                autoComplete="off"
                placeholder="000.000.000-00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary flex justify-between">
                <span>E-mail Pessoal</span>
                {emailValid === false && <span className="text-state-error normal-case font-semibold text-[12px]">E-mail tá meio estranho...</span>}
              </label>
              <input
                className={`w-full rounded-md border px-4 py-3.5 text-[15px] focus:outline-none focus:ring-1 transition-colors shadow-sm ${emailValid === false ? 'border-state-error focus:ring-state-error bg-state-error/5' : 'border-border-default bg-white focus:border-brand-primary focus:ring-brand-primary'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                autoComplete="email"
                placeholder="nome@provedor.com"
                disabled={loading}
              />
              {emailSugs.length > 0 && (
                 <ul className="absolute top-full mt-1 w-full bg-white border border-border-default rounded-md shadow-lg z-10 overflow-hidden">
                    {emailSugs.map(s => (
                       <li 
                         key={s} 
                         className="px-4 py-3 text-[14px] cursor-pointer hover:bg-bg-secondary text-text-primary font-medium"
                         onClick={() => { setEmail(s); setEmailSugs([]); }}
                       >
                         {s}
                       </li>
                    ))}
                 </ul>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary block">Número de Telefone</label>
              <input
                className="w-full rounded-md border border-border-default bg-white px-4 py-3.5 text-[15px] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors shadow-sm"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                maxLength={15}
                type="tel"
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-border-default">
              <label className="text-[13px] font-bold tracking-wider uppercase text-text-primary flex mt-2">Chave Mestra (Senha)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-md border border-border-default bg-white pl-4 pr-16 py-3.5 text-[15px] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Seu código secreto"
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

              {/* Password Checklist */}
              {password.length > 0 && (
                <ul className="grid grid-cols-2 gap-2 mt-3 bg-bg-surface p-3 rounded-md border border-border-default">
                  <li className={`text-[12px] font-semibold flex items-center gap-1.5 ${pwdReqs.length ? 'text-state-success' : 'text-text-secondary'}`}>
                    <span className="text-[15px] leading-none mb-0.5">{pwdReqs.length ? '✓' : '•'}</span> 8+ Caract.
                  </li>
                  <li className={`text-[12px] font-semibold flex items-center gap-1.5 ${pwdReqs.upper ? 'text-state-success' : 'text-text-secondary'}`}>
                    <span className="text-[15px] leading-none mb-0.5">{pwdReqs.upper ? '✓' : '•'}</span> Maiúscula
                  </li>
                  <li className={`text-[12px] font-semibold flex items-center gap-1.5 ${pwdReqs.lower ? 'text-state-success' : 'text-text-secondary'}`}>
                    <span className="text-[15px] leading-none mb-0.5">{pwdReqs.lower ? '✓' : '•'}</span> Minúscula
                  </li>
                  <li className={`text-[12px] font-semibold flex items-center gap-1.5 ${pwdReqs.number ? 'text-state-success' : 'text-text-secondary'}`}>
                    <span className="text-[15px] leading-none mb-0.5">{pwdReqs.number ? '✓' : '•'}</span> Número
                  </li>
                  <li className={`text-[12px] font-semibold flex items-center gap-1.5 ${pwdReqs.special ? 'text-state-success' : 'text-text-secondary'}`}>
                    <span className="text-[15px] leading-none mb-0.5">{pwdReqs.special ? '✓' : '•'}</span> Símbolo (@#$)
                  </li>
                </ul>
              )}
            </div>

            {/* Checkboxes de Contato */}
            <div className="pt-4 border-t border-border-default space-y-4">
               <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex items-start mt-0.5">
                     <input type="checkbox" className="peer sr-only" checked={optMessages} onChange={(e) => handleMessageOptIn(e.target.checked)} />
                     <div className="w-[20px] h-[20px] border-2 border-border-default rounded flex items-center justify-center peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-colors">
                        {optMessages && <span className="text-white text-[12px] font-bold">✓</span>}
                     </div>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary group-hover:text-brand-primary transition-colors">Receber mensagens do sistema</p>
                    <p className="text-[13px] text-text-secondary">Integração segura via Telegram (e breve WhatsApp).</p>
                  </div>
               </label>

               <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex items-start mt-0.5">
                     <input type="checkbox" className="peer sr-only" checked={optEmail} onChange={(e) => setOptEmail(e.target.checked)} />
                     <div className="w-[20px] h-[20px] border-2 border-border-default rounded flex items-center justify-center peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-colors">
                        {optEmail && <span className="text-white text-[12px] font-bold">✓</span>}
                     </div>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary group-hover:text-brand-primary transition-colors">Marketing e Educação</p>
                    <p className="text-[13px] text-text-secondary">Aceito receber conteúdos exclusivos e teses.</p>
                  </div>
               </label>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                className="w-full h-[60px] text-[16px] font-bold bg-brand-primary hover:bg-[#D95C24] text-white shadow-lg transition-transform active:scale-[0.98]"
                isLoading={loading}
                loadingLabel="Criando segurança..."
                disabled={!canSubmit}
              >
                Abrir Conta Imediatamente
              </Button>
            </div>

            <p className="text-center text-[14px] text-text-secondary pt-4">
              Já tem conta? <Link className="font-bold text-brand-primary hover:underline hover:text-[#D95C24]" to="/login">Fazer Login</Link>
            </p>
          </form>
        </section>
      </div>

      {/* Modal de Alerta de Recuperação */}
      {showRecoveryAlert && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-primary rounded-xl w-full max-w-sm p-6 shadow-2xl border border-border-default animate-in zoom-in-95 duration-200">
               <h3 className="font-display font-bold text-[22px] text-brand-primary mb-2">Atenção à Segurança</h3>
               <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                 Utilizamos os canais de mensagem exclusivamente para facilitar a <strong className="text-text-primary">Recuperação de Senha</strong> sem burocracia. Sem este recurso, você dependerá sempre de longas validações por email se esquecer sua senha.
               </p>
               <div className="flex flex-col gap-3">
                 <Button 
                   onClick={() => { setOptMessages(true); setShowRecoveryAlert(false); }}
                   className="w-full bg-brand-primary hover:bg-[#D95C24] text-white font-bold h-12 text-[15px]"
                 >
                   Manter Canal Ativo
                 </Button>
                 <Button 
                   variant="ghost" 
                   onClick={() => setShowRecoveryAlert(false)}
                   className="w-full font-bold text-text-secondary hover:text-state-error h-12 text-[14px]"
                 >
                   Entendo, deixar desativado
                 </Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

function normalizeAppTarget(target: string) {
  if (!target.startsWith("/")) return `/app/${target}`;
  if (target.startsWith("/app/")) return target;
  return `/app${target}`;
}
