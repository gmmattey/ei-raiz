import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function PWAInstallNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

    // Show nudge if iOS and NOT standalone
    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem("esquilo:pwa_nudge_dismissed");
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-text-primary text-white p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full -mr-16 -mt-16" />
        
        <button 
          onClick={() => {
            setShow(false);
            localStorage.setItem("esquilo:pwa_nudge_dismissed", "true");
          }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="flex items-start gap-5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20 text-[24px]">🐿️</div>
          <div>
            <h3 className="font-display font-bold text-[18px] leading-tight mb-1">Instale o Esquilo Invest</h3>
            <p className="text-[14px] text-white/70 leading-relaxed font-medium">Use como um aplicativo nativo no seu iPhone para acesso rápido.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[13px] font-bold py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full">1</span>
            <p>Toque no ícone de <span className="text-brand-primary">Compartilhar</span> <span className="opacity-60">(quadrado com seta)</span></p>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-bold py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full">2</span>
            <p>Role para baixo e toque em <span className="text-brand-primary">Adicionar à Tela de Início</span></p>
          </div>
        </div>

        <Button 
          onClick={() => setShow(false)}
          className="w-full mt-6 h-12 rounded-xl bg-white text-text-primary font-bold hover:bg-brand-primary hover:text-white transition-all"
        >
          Entendi
        </Button>
      </div>
    </div>
  );
}
