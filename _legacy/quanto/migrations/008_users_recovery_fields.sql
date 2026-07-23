-- Quanto Migration 008: add recovery fields to users for register/recover flow
ALTER TABLE users ADD COLUMN cpf TEXT;
ALTER TABLE users ADD COLUMN birth_date TEXT;
