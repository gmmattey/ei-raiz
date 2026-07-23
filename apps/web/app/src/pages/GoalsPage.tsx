import React from "react";
import { EmptyState } from "@/components/system/SystemState";

export function GoalsPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="ty-caption text-text-secondary">Metas</p>
        <h1 className="ty-h1 font-display">Suas metas</h1>
        <p className="ty-body text-text-secondary">
          Aqui você vai simular e acompanhar metas com um resultado claro e acionável.
        </p>
      </header>

      <EmptyState
        title="Em breve"
        body="Este módulo entra depois da leitura central (Home/Carteira/Radar). Por agora, complete seu contexto no Perfil."
        ctaLabel="Abrir Perfil"
        ctaTarget="/app/profile"
      />
    </div>
  );
}

