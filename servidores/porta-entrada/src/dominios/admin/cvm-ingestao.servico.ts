import type { Bd } from '../../infra/bd';
import { agora, gerarId } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioCvmIngestao } from './cvm-ingestao.repositorio';

export interface CotaCvmEntrada {
  cnpj: string;
  data: string;
  valorCota: number;
  patrimonioLiquidoBrl?: number;
}

export interface ExecucaoCvmEntrada {
  referenciaAnoMes: string;
  origemExecucao: 'manual' | 'scheduled' | 'github_action' | 'trigger';
}

export interface AtualizacaoExecucaoCvmEntrada {
  status?: 'concluido' | 'falhou';
  arquivosProcessados?: number;
  registrosLidos?: number;
  registrosValidos?: number;
  registrosInvalidos?: number;
  erroResumo?: string;
}

export function normalizarCnpjCvm(valor: string): string | null {
  const cnpj = valor.replace(/\D/g, '');
  return cnpj.length === 14 ? cnpj : null;
}

export function normalizarDataCvm(valor: string): string | null {
  const data = valor.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null;
}

export const servicoCvmIngestao = (bd: Bd) => ({
  async listarCnpjsAlvo(): Promise<ServiceResponse<{ cnpjs: string[] }>> {
    return sucesso({ cnpjs: await repositorioCvmIngestao(bd).listarCnpjsAlvo() });
  },

  async abrirExecucao(entrada: ExecucaoCvmEntrada): Promise<ServiceResponse<{ id: string }>> {
    const id = gerarId();
    await repositorioCvmIngestao(bd).criarExecucao(id, JSON.stringify(entrada));
    return sucesso({ id });
  },

  async ingerirCotas(execucaoId: string, itens: CotaCvmEntrada[]): Promise<ServiceResponse<{ inseridos: number }>> {
    const repo = repositorioCvmIngestao(bd);
    if (!(await repo.existeExecucao(execucaoId))) return erro('execucao_cvm_nao_encontrada', 'Execução CVM não encontrada', 404);

    const cotas = [] as { cnpj: string; data: string; valorCota: number; patrimonioLiquidoBrl: number | null }[];
    for (const item of itens) {
      const cnpj = normalizarCnpjCvm(item.cnpj);
      const data = normalizarDataCvm(item.data);
      if (!cnpj || !data || !Number.isFinite(item.valorCota) || item.valorCota <= 0) {
        return erro('cota_cvm_invalida', 'Cota CVM inválida', 422);
      }
      cotas.push({ cnpj, data, valorCota: item.valorCota, patrimonioLiquidoBrl: item.patrimonioLiquidoBrl ?? null });
    }
    await repo.gravarCotas(cotas, agora());
    return sucesso({ inseridos: itens.length });
  },

  async finalizarExecucao(id: string, entrada: AtualizacaoExecucaoCvmEntrada): Promise<ServiceResponse<{ id: string }>> {
    const status = entrada.status ?? 'concluido';
    const resultado = {
      arquivosProcessados: entrada.arquivosProcessados ?? 0,
      registrosLidos: entrada.registrosLidos ?? 0,
      registrosValidos: entrada.registrosValidos ?? 0,
      registrosInvalidos: entrada.registrosInvalidos ?? 0,
    };
    const atualizado = await repositorioCvmIngestao(bd).finalizarExecucao(
      id, status, agora(), JSON.stringify(resultado), entrada.erroResumo ?? null,
    );
    if (!atualizado) return erro('execucao_cvm_nao_encontrada', 'Execução CVM não encontrada', 404);
    return sucesso({ id });
  },
});
