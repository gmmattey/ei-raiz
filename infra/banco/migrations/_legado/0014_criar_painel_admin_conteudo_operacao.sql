CREATE TABLE IF NOT EXISTS content_blocks (
  chave TEXT PRIMARY KEY,
  modulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'texto',
  valor TEXT NOT NULL,
  visivel INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL DEFAULT 0,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_modulo_ordem ON content_blocks(modulo, ordem);

CREATE TABLE IF NOT EXISTS corretoras_suportadas (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ativo', 'beta', 'planejado')),
  mensagem_ajuda TEXT NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_corretoras_suportadas_status ON corretoras_suportadas(status);

CREATE TABLE IF NOT EXISTS admin_usuarios (
  email TEXT PRIMARY KEY,
  ativo INTEGER NOT NULL DEFAULT 1,
  concedido_por TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_auditoria (
  id TEXT PRIMARY KEY,
  acao TEXT NOT NULL,
  alvo TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  autor_email TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_auditoria_criado_em ON admin_auditoria(criado_em DESC);

INSERT OR IGNORE INTO content_blocks (chave, modulo, tipo, valor, visivel, ordem) VALUES
  ('landing.hero.titulo', 'landing', 'texto', 'Sua carteira merece', 1, 1),
  ('landing.hero.titulo_destaque', 'landing', 'texto', 'consolidação e clareza.', 1, 2),
  ('landing.hero.subtitulo', 'landing', 'texto', 'Consolidação real, diagnóstico claro e decisão orientada.', 1, 3),
  ('landing.hero.descricao', 'landing', 'texto', 'Centralize seus ativos, entenda concentração e risco da carteira e receba uma orientação objetiva do próximo passo.', 1, 4),
  ('landing.hero.cta_primario', 'landing', 'texto', 'Ver como funciona', 1, 5),
  ('landing.hero.cta_secundario', 'landing', 'texto', 'Saber mais sobre a gente', 1, 6),
  ('landing.como_funciona.titulo', 'landing', 'texto', 'Entenda como a gente te ajuda', 1, 10),
  ('landing.proposta.titulo', 'landing', 'texto', 'Acesso apenas leitura. Zero execução.', 1, 20),
  ('landing.footer.cta_titulo', 'landing', 'texto', 'O diagnóstico leva menos de 5 minutos.', 1, 30),
  ('landing.footer.cta_descricao', 'landing', 'texto', 'Crie sua conta, importe seu CSV e tenha uma leitura clara da sua carteira em minutos.', 1, 31),
  ('landing.footer.cta_botao', 'landing', 'texto', 'Acessar plataforma', 1, 32),
  ('home.cartao_principal.titulo', 'home', 'texto', 'Patrimônio Total', 1, 100),
  ('home.cartao_principal.sem_base', 'home', 'texto', 'Sua carteira ainda está vazia. Importe um CSV em /importar para liberar Home, Carteira, Insights e Histórico com dados reais.', 1, 101),
  ('home.quick_actions.titulo', 'home', 'texto', 'Acesso Rápido', 1, 102),
  ('importacao.upload.titulo', 'importacao', 'texto', 'Atualizar Carteira', 1, 200),
  ('importacao.upload.descricao', 'importacao', 'texto', 'Envie seu CSV e valide linha por linha antes de confirmar.', 1, 201),
  ('importacao.corretoras.titulo', 'importacao', 'texto', 'Integrações bancárias', 1, 202),
  ('importacao.corretoras.descricao', 'importacao', 'texto', 'Fluxo atual da plataforma: importação por CSV com revisão linha a linha antes de confirmar.', 1, 203);

INSERT OR IGNORE INTO corretoras_suportadas (id, codigo, nome, status, mensagem_ajuda) VALUES
  ('broker_xp', 'xp', 'XP Investimentos', 'ativo', 'Suportado via CSV padrão Esquilo.'),
  ('broker_rico', 'rico', 'Rico', 'ativo', 'Suportado via CSV padrão Esquilo.'),
  ('broker_itau', 'itau', 'Itaú', 'beta', 'Suporte parcial, revise o preview antes de confirmar.'),
  ('broker_nubank', 'nubank', 'Nubank', 'planejado', 'Mapeado para evolução de integração.');
