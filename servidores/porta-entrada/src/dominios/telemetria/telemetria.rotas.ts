import type { TelemetriaEventoEntrada, TelemetriaEventoSaida } from '@ei/contratos';
import type { Env } from '../../infra/bd';
import { criarBd, gerarId } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, sucesso, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';

export async function rotearTelemetria(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/telemetria/eventos' && metodo === 'POST') {
    const entrada = await lerJson(request) as TelemetriaEventoEntrada;
    if (!entrada?.nome) return erro('nome_obrigatorio', 'Nome do evento é obrigatório', 400);
    const bd = criarBd(env);
    const id = gerarId();
    const dados = JSON.stringify(entrada.dadosJson ?? {});
    const ocorrido = entrada.ocorridoEm ?? new Date().toISOString();
    await bd.executar(
      `INSERT INTO telemetria_eventos (id, usuario_id, evento, ocorrido_em, dados_json) VALUES (?, ?, ?, ?, ?)`,
      id, sessao?.usuarioId ?? null, entrada.nome, ocorrido, dados,
    );
    const resp: TelemetriaEventoSaida = { id, aceito: true };
    return sucesso(resp);
  }

  return caminho.startsWith('/api/telemetria') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
