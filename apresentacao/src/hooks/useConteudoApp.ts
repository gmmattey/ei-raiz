import { useEffect, useMemo, useState } from "react";
import { conteudoApi } from "../cliente-api";

const booleanTrueValues = new Set(["1", "true", "sim", "yes", "on"]);

export function useConteudoApp() {
  const [mapa, setMapa] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const carregar = async (ativoRef: { ativo: boolean }) => {
    try {
      const resposta = await conteudoApi.obterConteudoApp();
      if (!ativoRef.ativo) return;
      setMapa(resposta.mapa ?? {});
    } catch {
      if (ativoRef.ativo) setMapa({});
    } finally {
      if (ativoRef.ativo) setLoading(false);
    }
  };

  useEffect(() => {
    const ativoRef = { ativo: true };
    void carregar(ativoRef);
    const onAtualizar = () => {
      setLoading(true);
      void carregar(ativoRef);
    };
    window.addEventListener("ei:conteudo-atualizado", onAtualizar);
    return () => {
      ativoRef.ativo = false;
      window.removeEventListener("ei:conteudo-atualizado", onAtualizar);
    };
  }, []);

  const helpers = useMemo(
    () => ({
      texto: (chave: string, fallback: string): string => mapa[chave] ?? fallback,
      booleano: (chave: string, fallback: boolean): boolean => {
        const valor = mapa[chave];
        if (typeof valor !== "string") return fallback;
        return booleanTrueValues.has(valor.trim().toLowerCase());
      },
      mapa,
    }),
    [mapa],
  );

  return { ...helpers, loading };
}
