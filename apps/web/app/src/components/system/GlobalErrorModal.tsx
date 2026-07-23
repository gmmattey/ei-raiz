import React from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/core/state/app_store";
import { useStoreSelector } from "@/core/state/react";
import { Button } from "@/components/ui/button";

export function GlobalErrorModal() {
  const store = useAppStore();
  const error = useStoreSelector(store, (s) => s.ui.errorModal);

  const close = React.useCallback(() => {
     store.setState((s) => ({ ...s, ui: { ...s.ui, errorModal: { ...s.ui.errorModal, isOpen: false } } }));
  }, [store]);

  if (!error.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={close}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl shadow-black/40 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out">
        <div className="w-20 h-20 bg-state-error/10 text-state-error rounded-2xl flex items-center justify-center text-[38px] mb-8 font-display font-bold">
           !
        </div>
        
        <h2 className="font-display font-bold text-[32px] text-text-primary mb-4 leading-tight tracking-tight">
          {error.title || "Opa, algo deu errado"}
        </h2>
        
        <p className="text-[17px] text-text-secondary leading-relaxed mb-10">
          {error.body || "Aconteceu um imprevisto técnico. Pode tentar novamente?"}
        </p>

        <div className="flex flex-col gap-3">
          {error.ctaTarget ? (
            <Button asChild size="lg" className="h-16 w-full rounded-2xl bg-text-primary text-white font-bold text-[16px] shadow-xl shadow-black/10" onClick={close}>
              <Link to={error.ctaTarget}>{error.ctaLabel || "Entendi"}</Link>
            </Button>
          ) : (
            <Button size="lg" className="h-16 w-full rounded-2xl bg-text-primary text-white font-bold text-[16px] shadow-xl shadow-black/10" onClick={close}>
              {error.ctaLabel || "Tudo bem, fechar"}
            </Button>
          )}
          
          <Button variant="ghost" className="h-12 w-full text-text-secondary font-bold text-[14px]" onClick={close}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
