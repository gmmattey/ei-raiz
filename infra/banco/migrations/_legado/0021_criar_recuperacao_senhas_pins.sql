-- Tabela temporária para mapear PIN de 6 dígitos → token de recuperação
-- Usada durante o fluxo de recuperação de senha para validar o PIN enviado por email
CREATE TABLE recuperacao_senhas_pins (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pin TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  email TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_recuperacao_senhas_pins_email ON recuperacao_senhas_pins(email);
CREATE INDEX idx_recuperacao_senhas_pins_pin ON recuperacao_senhas_pins(pin);
CREATE INDEX idx_recuperacao_senhas_pins_expira_em ON recuperacao_senhas_pins(expira_em);
