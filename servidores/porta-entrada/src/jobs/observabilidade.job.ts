import type { Env } from '../infra/bd';
import { agora, criarBd, gerarId } from '../infra/bd';

export async function executarJobMonitorado(
  env: Env,
  nome: string,
  executar: () => Promise<number>,
): Promise<void> {
  const bd = criarBd(env);
  const id = gerarId();
  const iniciadoEm = agora();
  const iniciadoMs = Date.now();
  await bd.executar(
    `INSERT INTO job_execucoes (id, nome, status, iniciado_em) VALUES (?, ?, 'executando', ?)`,
    id, nome, iniciadoEm,
  );
  try {
    const volume = await executar();
    await bd.executar(
      `UPDATE job_execucoes
          SET status = 'concluido', concluido_em = ?, duracao_ms = ?, volume = ?
        WHERE id = ?`,
      agora(), Date.now() - iniciadoMs, volume, id,
    );
  } catch (causa) {
    const erro = String(causa instanceof Error ? causa.message : causa).slice(0, 1000);
    await bd.executar(
      `UPDATE job_execucoes
          SET status = 'falhou', concluido_em = ?, duracao_ms = ?, erro = ?
        WHERE id = ?`,
      agora(), Date.now() - iniciadoMs, erro, id,
    );
    console.error('job_falhou', { nome, id, erro });
    throw causa;
  }
}
