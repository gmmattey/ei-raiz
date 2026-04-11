import React from "react";

export function LoadingState({ text }) {
  return <div className="p-6 text-sm text-[#0B1218]/50">{text || "Carregando..."}</div>;
}

export function ErrorState({ text }) {
  return <div className="p-6 text-sm text-[#E85C5C]">{text || "Falha ao carregar."}</div>;
}

export function EmptyState({ text, action }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-[#0B1218]/60">{text}</p>
      {action ? action : null}
    </div>
  );
}
