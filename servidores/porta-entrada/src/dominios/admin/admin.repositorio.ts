import type { Bd } from '../../infra/bd';

export interface LinhaAdminUsuario {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  criado_em: string;
}

export interface LinhaAuditoria {
  id: string;
  autor_email: string;
  acao: string;
  recurso: string | null;
  dados_json: string;
  ocorrido_em: string;
}

export interface LinhaIngestaoCvm {
  id: string;
  modo: 'ingestao' | 'backfill';
  status: string;
  iniciado_em: string;
  concluido_em: string | null;
  duracao_segundos: number | null;
  parametros_json: string;
  resultado_json: string;
  erro: string | null;
}

export const repositorioAdmin = (bd: Bd) => ({
  async ehAdmin(email: string): Promise<boolean> {
    const l = await bd.primeiro<{ email: string }>(
      `SELECT email FROM admin_usuarios WHERE email = ? LIMIT 1`,
      email.toLowerCase(),
    );
    return l != null;
  },

  async listarUsuarios(limite = 100): Promise<LinhaAdminUsuario[]> {
    return bd.consultar<LinhaAdminUsuario>(
      `SELECT id, nome, email, cpf, criado_em FROM usuarios ORDER BY criado_em DESC LIMIT ?`,
      limite,
    );
  },

  async auditoria(limite = 100): Promise<LinhaAuditoria[]> {
    return bd.consultar<LinhaAuditoria>(
      `SELECT id, autor_email, acao, recurso, dados_json, ocorrido_em
         FROM admin_auditoria ORDER BY ocorrido_em DESC LIMIT ?`,
      limite,
    );
  },

  async ingestoesCvm(limite = 20): Promise<LinhaIngestaoCvm[]> {
    return bd.consultar<LinhaIngestaoCvm>(
      `SELECT * FROM vw_admin_ingestao_cvm ORDER BY iniciado_em DESC LIMIT ?`,
      limite,
    );
  },

  async registrarAuditoria(id: string, autorEmail: string, acao: string, recurso: string | null, dadosJson: string): Promise<void> {
    await bd.executar(
      `INSERT INTO admin_auditoria (id, autor_email, acao, recurso, dados_json) VALUES (?, ?, ?, ?, ?)`,
      id, autorEmail, acao, recurso, dadosJson,
    );
  },
});
