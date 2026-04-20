-- Renomeia retorno_12m → rentabilidade_desde_aquisicao_pct.
--
-- A coluna nunca representou "retorno de 12 meses"; sempre guardou a rentabilidade
-- acumulada desde a data de aquisição do ativo. O nome legado foi carregado
-- desde a migration 0004 e propagou confusão por todo o contrato e frontend
-- (três nomes redundantes apontando para o mesmo valor).
--
-- Consumidores impactados:
--   - ServicoCarteiraPadrao.mapComAtualizacao → escreve via atualizarValorAtivo
--   - RepositorioCarteira → leitura em listarAtivos
--   - Frontend legado Carteira.jsx, Home.jsx, HomeMobile.jsx, AssetCategoryView.jsx
--
-- Todos serão atualizados na mesma release.

ALTER TABLE ativos RENAME COLUMN retorno_12m TO rentabilidade_desde_aquisicao_pct;
