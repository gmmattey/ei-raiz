import React from "react";

export type InstitutionId = "xp" | "itau" | "ion" | "nubank" | "btg" | "santander" | "bb" | string;

export function BankLogo({ id, className = "w-6 h-6" }: { id: InstitutionId; className?: string }) {
  const normalizedId = id.toLowerCase();

  switch (normalizedId) {
    case "xp":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 21H21L12 2Z" fill="#242424" />
          <path d="M11 10L13 10L12 8L11 10Z" fill="#F8B133" />
        </svg>
      );
    case "itau":
    case "ion":
      return (
        <div className={`rounded flex items-center justify-center bg-[#EC7000] text-white font-bold text-[10px] ${className}`}>
          I
        </div>
      );
    case "nubank":
    case "nu":
      return (
        <div className={`rounded-full flex items-center justify-center bg-[#820AD1] text-white font-bold text-[10px] ${className}`}>
          Nu
        </div>
      );
    case "btg":
      return (
        <div className={`rounded flex items-center justify-center bg-[#001D4B] text-white font-black text-[9px] ${className}`}>
          BTG
        </div>
      );
    case "santander":
      return (
        <div className={`rounded-full flex items-center justify-center bg-[#EC0000] text-white font-bold text-[10px] ${className}`}>
          S
        </div>
      );
    default:
      return (
        <div className={`rounded-lg bg-bg-secondary flex items-center justify-center text-text-disabled text-[10px] font-bold ${className}`}>
          ?
        </div>
      );
  }
}
