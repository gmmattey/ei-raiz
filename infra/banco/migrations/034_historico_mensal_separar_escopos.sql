-- Separa escopos em historico_carteira_mensal.
--
-- BUG histórico (até release deste patch):
--   total_atual vinha de payload.patrimonioTotal = (investimentos + bens +
--   poupança), enquanto total_investido agregava apenas (qtd × preço) dos
--   ativos listados. A razão base100 do gráfico mensal ficava semanticamente
--   falsa — usuário com patrimônio imobilizado alto via retornos inflados de
--   centenas de %.
--
-- Correção conceitual:
--   Rentabilidade é SOBRE investimentos líquidos (ações, fundos, RF, previdência).
--   Bens e poupança não têm "rentabilidade" no mesmo sentido — entram apenas
--   na composição patrimonial, não na série de retorno.
--
-- Mudanças:
--   + valor_investimentos           = soma marcada a mercado dos ativos (= antigo patrimonioInvestimentos)
--   + confiavel                     = 0 quando algum ativo do mês caiu em fallback (sem cota histórica)
--   retorno_mes  → rentabilidade_mes_pct   = ((V_fim − V_inicio − Σaportes_mes) / V_inicio) × 100  (TWR)
--   retorno_acum → rentabilidade_acum_pct  = base 100 ancorada no primeiro mês, calculada sobre valor_investimentos
--
-- total_investido e total_atual permanecem existindo (total_atual = patrimônio
-- líquido consolidado para outros usos; total_investido = Σ(qtd × preço) para
-- exibição de custo).

ALTER TABLE historico_carteira_mensal ADD COLUMN valor_investimentos REAL NOT NULL DEFAULT 0;
ALTER TABLE historico_carteira_mensal ADD COLUMN confiavel INTEGER NOT NULL DEFAULT 1;

ALTER TABLE historico_carteira_mensal RENAME COLUMN retorno_mes  TO rentabilidade_mes_pct;
ALTER TABLE historico_carteira_mensal RENAME COLUMN retorno_acum TO rentabilidade_acum_pct;

-- Backfill conservador: registros existentes foram gravados com o bug. Usamos
-- total_investido como proxy de valor_investimentos (sempre ≤ valor real, mas
-- preserva ordem de grandeza). A reconstrução retroativa pós-deploy sobrescreve
-- com valores corretos, carimbando confiavel=1.
UPDATE historico_carteira_mensal
   SET valor_investimentos = total_investido
 WHERE valor_investimentos = 0;

-- Marca TODOS os registros existentes como não-confiáveis até a reconstrução
-- rodar. O frontend deve exibir "—" em vez de número para esses pontos.
UPDATE historico_carteira_mensal SET confiavel = 0;
