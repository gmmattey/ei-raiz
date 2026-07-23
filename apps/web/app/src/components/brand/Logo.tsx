import * as React from "react";

import logoHorizontal from "@/assets/brandbook/logo/esquilo-invest-logo-horizontal.svg";
import simbolo from "@/assets/brandbook/logo/esquilo-invest-simbolo.svg";

export function Logo({
  kind = "horizontal",
  className,
  title = "Esquilo Invest",
}: {
  kind?: "horizontal" | "simbolo";
  className?: string;
  title?: string;
}) {
  const src = kind === "simbolo" ? simbolo : logoHorizontal;

  return <img src={src} alt={title} className={className} />;
}
