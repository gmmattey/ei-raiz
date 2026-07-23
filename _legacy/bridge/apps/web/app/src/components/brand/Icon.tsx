import * as React from "react";
import { cn } from "@/lib/utils";

import home from "@/assets/brandbook/icones/home-premium.svg?raw";
import carteira from "@/assets/brandbook/icones/carteira-premium.svg?raw";
import perfil from "@/assets/brandbook/icones/perfil-premium.svg?raw";
import score from "@/assets/brandbook/icones/score-premium.svg?raw";
import alerta from "@/assets/brandbook/icones/alerta-premium.svg?raw";
import importar from "@/assets/brandbook/icones/importar-premium.svg?raw";
import historico from "@/assets/brandbook/icones/historico-premium.svg?raw";
import radar from "@/assets/brandbook/icones/radar-premium.svg?raw";

import homeFilled from "@/assets/brandbook/icones/filled_active/home-filled.svg?raw";
import carteiraFilled from "@/assets/brandbook/icones/filled_active/carteira-filled.svg?raw";
import perfilFilled from "@/assets/brandbook/icones/filled_active/perfil-filled.svg?raw";
import scoreFilled from "@/assets/brandbook/icones/filled_active/score-filled.svg?raw";
import alertaFilled from "@/assets/brandbook/icones/filled_active/alerta-filled.svg?raw";

const ICONS = {
  home,
  carteira,
  perfil,
  score,
  alerta,
  importar,
  historico,
  radar,
  "home-filled": homeFilled,
  "carteira-filled": carteiraFilled,
  "perfil-filled": perfilFilled,
  "score-filled": scoreFilled,
  "alerta-filled": alertaFilled,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className,
  title,
}: {
  name: IconName;
  className?: string;
  title?: string;
}) {
  const svg = ICONS[name];
  return (
    <span
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn(
        // Default: size via font-size, keep currentColor (icons from BrandBook were designed for this).
        "inline-flex leading-none text-[18px] [&>svg]:block [&>svg]:h-[1em] [&>svg]:w-[1em]",
        className,
      )}
      // Trusted local SVG assets from BrandBook; inline keeps currentColor styling.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
