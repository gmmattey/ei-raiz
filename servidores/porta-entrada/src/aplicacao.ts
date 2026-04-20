// Roteador canônico: resolve domínio pelo prefixo do caminho e delega.

import type { Env } from './infra/bd';
import { erro, naoEncontrado, type ServiceResponse } from './infra/http';
import type { ContextoSessao } from './infra/sessao';
import { validarToken } from './infra/cripto';
import { rotearAuth } from './dominios/auth/auth.rotas';
import { rotearUsuario } from './dominios/usuario/usuario.rotas';
import { rotearPerfil } from './dominios/perfil/perfil.rotas';
import { rotearMercado } from './dominios/mercado/mercado.rotas';
import { rotearPatrimonio } from './dominios/patrimonio/patrimonio.rotas';
import { rotearDecisoes } from './dominios/decisoes/decisoes.rotas';
import { rotearAdmin } from './dominios/admin/admin.rotas';
import { rotearTelemetria } from './dominios/telemetria/telemetria.rotas';

export const ROTAS_PUBLICAS = new Set<string>([
  '/api/auth/registrar',
  '/api/auth/entrar',
  '/api/auth/sair',
  '/api/auth/recuperar/iniciar',
  '/api/auth/recuperar/confirmar',
  '/api/auth/recuperar/redefinir',
  '/api/admin/entrar',
  '/api/telemetria/eventos',
]);

export const PREFIXOS_MERCADO_PUBLICO = ['/api/mercado/ativos', '/api/mercado/fundos-cvm'];

export function ehRotaPublica(caminho: string): boolean {
  if (ROTAS_PUBLICAS.has(caminho)) return true;
  if (PREFIXOS_MERCADO_PUBLICO.some((p) => caminho.startsWith(p))) return true;
  return false;
}

export async function resolverSessao(request: Request, env: Env): Promise<ContextoSessao | null> {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const [tipo, token] = auth.split(' ');
  if (!tipo || !token || tipo.toLowerCase() !== 'bearer') return null;
  const payload = await validarToken(token, env.JWT_SECRET);
  if (!payload) return null;
  const u = await env.DB.prepare(`SELECT id, nome, email FROM usuarios WHERE id = ? LIMIT 1`)
    .bind(payload.usuarioId)
    .first<{ id: string; nome: string; email: string }>();
  if (!u) return null;
  const adm = await env.DB.prepare(`SELECT email FROM admin_usuarios WHERE email = ? LIMIT 1`)
    .bind(u.email)
    .first<{ email: string }>();
  return {
    usuarioId: u.id,
    nome: u.nome,
    email: u.email,
    ehAdmin: adm != null,
  };
}

export async function rotear(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  if (caminho.startsWith('/api/auth/')) return rotearAuth(caminho, request, env, sessao);
  if (caminho.startsWith('/api/usuario')) return rotearUsuario(caminho, request, env, sessao);
  if (caminho.startsWith('/api/perfil')) return rotearPerfil(caminho, request, env, sessao);
  if (caminho.startsWith('/api/mercado/')) return rotearMercado(caminho, request, env, sessao);
  if (caminho.startsWith('/api/patrimonio')) return rotearPatrimonio(caminho, request, env, sessao);
  if (caminho.startsWith('/api/decisoes')) return rotearDecisoes(caminho, request, env, sessao);
  if (caminho.startsWith('/api/admin')) return rotearAdmin(caminho, request, env, sessao);
  if (caminho.startsWith('/api/telemetria')) return rotearTelemetria(caminho, request, env, sessao);
  return naoEncontrado();
}

export { erro };
