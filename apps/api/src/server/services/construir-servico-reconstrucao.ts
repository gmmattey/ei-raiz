/**
 * Factory única do ServicoReconstrucaoCarteiraPadrao com todas as dependências
 * injetadas.
 *
 * Centraliza a configuração para garantir que todo call site use o mesmo
 * conjunto de provedores (histórico BRAPI + fechamentos CVM para fundos) e
 * não esqueça de injetar dependências novas.
 */

import {
  FonteDadosReconstrucaoD1,
  RepositorioFilaReconstrucaoD1,
  RepositorioHistoricoMensalD1,
  ServicoReconstrucaoCarteiraPadrao,
} from "@ei/servico-historico";
import type { Env } from "../types/gateway";
import { construirProvedorHistoricoCotacoes } from "./provedor-historico-cotacoes";
import { construirCvmFundosProvider } from "./provedor-cotacao-fundos-cvm";

export function construirServicoReconstrucao(env: Env): ServicoReconstrucaoCarteiraPadrao {
  return new ServicoReconstrucaoCarteiraPadrao({
    fila: new RepositorioFilaReconstrucaoD1(env.DB),
    historicoMensal: new RepositorioHistoricoMensalD1(env.DB),
    fonte: new FonteDadosReconstrucaoD1(env.DB),
    provedorHistorico: construirProvedorHistoricoCotacoes(env),
    provedorFundos: construirCvmFundosProvider(env),
  });
}
