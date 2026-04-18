-- Adiciona suporte a itens de patrimônio na importação (imóveis, veículos, poupança)
-- metadata_json armazena campos específicos por tipo sem explosão de schema
ALTER TABLE itens_importacao ADD COLUMN metadata_json TEXT DEFAULT '{}';

-- Adiciona campo de aba de origem para rastrear o tipo do item no XLSX
ALTER TABLE itens_importacao ADD COLUMN aba_origem TEXT;
