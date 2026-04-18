-- Preferências de interface por usuário (mobile/web).
-- Persistência server-side para suporte multi-dispositivo.

CREATE TABLE IF NOT EXISTS preferencias_usuario (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL UNIQUE,
  tema TEXT NOT NULL DEFAULT 'light' CHECK (tema IN ('light', 'dark')),
  ocultar_valores INTEGER NOT NULL DEFAULT 0 CHECK (ocultar_valores IN (0, 1)),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_preferencias_usuario_usuario_id
  ON preferencias_usuario(usuario_id);
