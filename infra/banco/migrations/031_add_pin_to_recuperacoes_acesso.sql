-- Adiciona coluna PIN para rastreamento do PIN enviado por email
-- Permite validar o PIN sem ter que rederivá-lo a partir do token (que não é armazenado)
ALTER TABLE recuperacoes_acesso ADD COLUMN pin TEXT;

CREATE INDEX IF NOT EXISTS idx_recuperacoes_pin ON recuperacoes_acesso(pin);
