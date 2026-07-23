import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

import { RadarIcon, RocketIcon } from "@/components/system/Icons";

export function SplashPage() {
  const slides = [
    {
      img: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=1920",
      title: "Cuidando do Amanhã",
      body: "Investindo no futuro de quem você ama."
    },
    {
      img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1920",
      title: "Acelerando Sonhos",
      body: "Liberdade para conquistar o que vier pela frente."
    },
    {
      img: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1920",
      title: "Colhendo Serenidade",
      body: "Desfrutando a paz de um patrimônio bem cuidado."
    }
  ];

  const [activeSlide, setActiveSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col overflow-x-hidden selection:bg-brand-primary/20 font-sans">
      
      {/* Header (Minimalist & Transparent) */}
      <nav className="fixed top-0 left-0 right-0 h-24 flex items-center justify-between px-8 md:px-16 z-50 bg-white/40 backdrop-blur-md transition-all duration-300">
         <Logo className="h-7 md:h-8 w-auto" />
         <div className="flex items-center gap-8">
            <Link to="/register" className="text-[13px] font-bold uppercase tracking-widest text-text-secondary hover:text-brand-primary transition-colors hidden sm:block">Criar conta</Link>
            <Button asChild variant="secondary" className="h-10 px-8 font-bold border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white rounded-full transition-all text-[12px] uppercase tracking-wider">
               <Link to="/login">Faça seu Login</Link>
            </Button>
         </div>
      </nav>

      {/* Main Content Area (Sophisticated Centered Stack) */}
      <main className="flex-1 flex flex-col items-center pt-48 pb-32">
        
        {/* Hero Section (Focus on Clarity) */}
        <section className="max-w-4xl px-8 text-center mb-24">
          <p className="text-[11px] font-bold tracking-[0.6em] uppercase text-brand-primary mb-8 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            Inteligência Independente
          </p>
          <h1 className="font-display font-extrabold text-[48px] sm:text-[72px] lg:text-[92px] leading-[1] tracking-tighter text-text-primary mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-backwards">
            Conquiste sua <br/>
            <span className="text-brand-primary italic">Clareza Patrimonial.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-[18px] sm:text-[21px] leading-relaxed text-text-secondary font-medium tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400 fill-mode-backwards opacity-80">
            O Esquilo unifica seu dinheiro investido, traduz a linguagem técnica para decisões simples e protege seu tempo. O padrão de gestão que você merece.
          </p>
        </section>

        {/* Visual Core (Fintech Abstract Carousel) */}
        <div className="w-full max-w-7xl px-4 md:px-12 mb-32 group relative">
           <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-[48px] overflow-hidden bg-bg-secondary border border-border-default/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] animate-in zoom-in-95 duration-1000 delay-600 fill-mode-backwards hover:shadow-2xl transition-all">
              
              {/* Slides */}
              {slides.map((slide, idx) => (
                 <div 
                   key={idx}
                   className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1) ${activeSlide === idx ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                   style={{ backgroundImage: `url('${slide.img}')` }}
                 />
              ))}
              
              {/* Premium Glass Overlays */}
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
           </div>

           {/* Floating Badge (Synced with Slide) */}
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-border-default shadow-2xl rounded-3xl px-10 py-6 flex items-center gap-6 z-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000 fill-mode-backwards border-brand-primary/20 w-[380px] max-w-[calc(100vw-48px)] h-[100px]">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                 <Logo kind="simbolo" className="h-7 w-auto" />
              </div>
              <div className="overflow-hidden flex flex-col justify-center">
                 <p className="text-[15px] font-bold text-text-primary tracking-tight leading-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-500">
                    {slides[activeSlide]?.title ?? ""}
                 </p>
                 <p className="text-[13px] text-text-secondary font-medium leading-tight opacity-80 overflow-hidden text-ellipsis line-clamp-2">
                    {slides[activeSlide]?.body ?? ""}
                 </p>
              </div>
           </div>
        </div>

        {/* Benefits Grid (Ultra Minimalist) */}
        <section className="max-w-6xl w-full px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-left mb-32 animate-in fade-in duration-1000 delay-1200 fill-mode-backwards">
           <div className="group space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-bg-secondary flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                 <RadarIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-[24px] text-text-primary tracking-tight">Sinal Próprio</h3>
              <p className="text-[16px] text-text-secondary leading-relaxed font-medium opacity-80">Independência real. Nossa tecnologia analisa sua carteira sem conflito de interesses de corretoras.</p>
           </div>
           
           <div className="group space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-bg-secondary flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                 <span className="text-[24px] font-bold">∑</span>
              </div>
              <h3 className="font-display font-bold text-[24px] text-text-primary tracking-tight">O Tradutor Fiel</h3>
              <p className="text-[16px] text-text-secondary leading-relaxed font-medium opacity-80">Convertemos economês para português. Você entende o risco e o potencial de cada centavo seu.</p>
           </div>

           <div className="group space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-bg-secondary flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                 <RocketIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-[24px] text-text-primary tracking-tight">Execução Direta</h3>
              <p className="text-[16px] text-text-secondary leading-relaxed font-medium opacity-80">Apontamos a estratégia ideal para o seu perfil. Você executa onde quiser, com plena consciência.</p>
           </div>
        </section>

        {/* Huge Direct CTA (High Contrast) */}
        <section className="text-center px-8 animate-in fade-in duration-1000 delay-1500 fill-mode-backwards w-full">
           <div className="bg-text-primary py-24 px-8 rounded-[64px] max-w-6xl mx-auto flex flex-col items-center">
              <h4 className="font-display font-bold text-[36px] sm:text-[48px] text-white mb-10 tracking-tight leading-tight">Chega de ruído. Comece sua <br/> clareza financeira agora.</h4>
              <Button asChild size="lg" className="h-16 px-10 font-bold text-[18px] bg-brand-primary hover:bg-white hover:text-brand-primary text-white shadow-2xl transition-all rounded-full group uppercase tracking-widest">
                <Link to="/register">
                  Começar agora (Grátis)
                  <span className="ml-4 group-hover:ml-6 transition-all">→</span>
                </Link>
              </Button>
              <p className="text-[14px] text-white/40 mt-12 font-medium tracking-wide">
                Configuração em minutos. <Link to="/login" className="text-white hover:text-brand-primary font-bold border-b border-white/20 pb-0.5 ml-1 transition-all">Já possuo acesso</Link>
              </p>
           </div>
        </section>
      </main>
    </div>
  );
}
