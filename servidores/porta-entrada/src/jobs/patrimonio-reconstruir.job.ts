// Drena a fila `patrimonio_fila_reconstrucao`, recalculando
// `patrimonio_itens.valor_atual_brl = quantidade * preco` usando a última
// cotação disponível. Também propaga o preço médio quando não há cotação.

import type { Env } from '../infra/bd';
import { agora, criarBd } from '../infra/bd';

interface LinhaFila {
  id: string;
  usuario_id: string;
}

interface LinhaItemComPreco {
  id: string;
  quantidade: number | null;
  preco_medio_brl: number | null;
  preco_atual_brl: number | null;
}

export async function patrimonioReconstruirJob(env: Env): Promise<void> {
  const bd = criarBd(env);
  const fila = await bd.consultar<LinhaFila>(
    `SELECT id, usuario_id FROM patrimonio_fila_reconstrucao
      WHERE status = 'pendente' ORDER BY agendado_em ASC LIMIT 50`,
  );
  if (fila.length === 0) return;

  const timestamp = agora();

  for (const tarefa of fila) {
    try {
      await bd.executar(
        `UPDATE patrimonio_fila_reconstrucao SET status = 'processando', iniciado_em = ? WHERE id = ?`,
        timestamp,
        tarefa.id,
      );

      const itens = await bd.consultar<LinhaItemComPreco>(
        `SELECT p.id, p.quantidade, p.preco_medio_brl,
                (SELECT preco_brl FROM ativos_cotacoes_cache c WHERE c.ativo_id = p.ativo_id ORDER BY cotado_em DESC LIMIT 1) AS preco_atual_brl
           FROM patrimonio_itens p
          WHERE p.usuario_id = ? AND p.esta_ativo = 1`,
        tarefa.usuario_id,
      );

      for (const item of itens) {
        const preco = item.preco_atual_brl ?? item.preco_medio_brl ?? 0;
        const quantidade = item.quantidade ?? 0;
        const valor = quantidade * preco;
        await bd.executar(
          `UPDATE patrimonio_itens SET valor_atual_brl = ?, atualizado_em = ? WHERE id = ?`,
          valor,
          timestamp,
          item.id,
        );
      }

      await bd.executar(
        `UPDATE patrimonio_fila_reconstrucao SET status = 'concluido', processado_em = ? WHERE id = ?`,
        agora(),
        tarefa.id,
      );
    } catch (erro) {
      await bd.executar(
        `UPDATE patrimonio_fila_reconstrucao SET status = 'falhou', erro = ?, processado_em = ? WHERE id = ?`,
        String(erro instanceof Error ? erro.message : erro),
        agora(),
        tarefa.id,
      );
    }
  }
}
