import { useMemo } from "react";

// Conteúdo editorial (chave→texto) não tem endpoint canônico nos 6 domínios
// públicos do backend rebuild. Hook passa a ser stub que sempre devolve fallback.
// Será revisto em Etapa 8 se o produto pedir endpoint dedicado em admin/.
const booleanTrueValues = new Set(["1", "true", "sim", "yes", "on"]);

export function useConteudoApp() {
  const mapa: Record<string, string> = useMemo(() => ({}), []);

  const helpers = useMemo(
    () => ({
      texto: (_chave: string, fallback: string): string => fallback,
      booleano: (_chave: string, fallback: boolean): boolean => {
        // referência usada para manter o tipo do set sem warning
        void booleanTrueValues;
        return fallback;
      },
      mapa,
    }),
    [mapa],
  );

  return { ...helpers, loading: false };
}
