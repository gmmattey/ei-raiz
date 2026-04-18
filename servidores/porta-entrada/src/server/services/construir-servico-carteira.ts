/**
 * Factory única do ServicoCarteiraPadrao com todas as dependências injetadas.
 *
 * Centraliza a configuração para garantir que todo call site use o mesmo
 * conjunto de provedores (BRAPI, CVM-D1, etc.) e não esqueça de injetar
 * dependências novas.
 */

import { RepositorioCarteiraD1, ServicoCarteiraPadrao } from "@ei/servico-carteira";
import type { Env } from "../types/gateway";
import { construirCvmFundosProvider } from "./provedor-cotacao-fundos-cvm";

export function construirServicoCarteira(env: Env): ServicoCarteiraPadrao {
  return new ServicoCarteiraPadrao({
    repositorio: new RepositorioCarteiraD1(env.DB),
    brapiToken: env.BRAPI_TOKEN,
    brapiBaseUrl: env.BRAPI_BASE_URL,
    provedorCotacaoFundos: construirCvmFundosProvider(env),
  });
}
