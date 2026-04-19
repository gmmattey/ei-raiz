-- Parâmetros de mercado adicionais para simuladores de decisão
INSERT OR IGNORE INTO simulacoes_parametros (id, chave, valor_json, descricao, origem, ativo) VALUES
  ('simparam_7',  'imovel_juros_padrao',          '{"valor": 0.1050, "label": "10,50% a.a.", "fonte": "Caixa Econômica / Banco do Brasil (ref. 2025)"}',    'Taxa de juros média financiamento imobiliário (SAC/Price)', 'seed', 1),
  ('simparam_8',  'imovel_itbi_padrao',            '{"valor": 0.030, "label": "3% do valor",  "fonte": "ITBI médio capitais brasileiras"}',                   'ITBI + custos cartório sobre valor do imóvel', 'seed', 1),
  ('simparam_9',  'imovel_manutencao_padrao',      '{"valor": 0.005, "label": "0,5% a.a.",    "fonte": "Referência ABNT / mercado imobiliário"}',             'Custo anual de manutenção sobre valor do imóvel', 'seed', 1),
  ('simparam_10', 'carro_juros_padrao',            '{"valor": 0.1600, "label": "16,00% a.a.", "fonte": "Banco Central do Brasil — CDC veículos (ref. 2025)"}',"Taxa média CDC veículos — financiamento com alienação", 'seed', 1),
  ('simparam_11', 'carro_seguro_pct_padrao',       '{"valor": 0.0375, "label": "3,75% a.a.", "fonte": "Média SUSEP / seguradoras líderes (ref. 2025)"}',     'Seguro anual como % do valor do veículo', 'seed', 1),
  ('simparam_12', 'carro_manutencao_pct_padrao',   '{"valor": 0.027,  "label": "2,7% a.a.",  "fonte": "FENABRAVE — custo médio manutenção preventiva"}',     'Manutenção anual como % do valor do veículo', 'seed', 1),
  ('simparam_13', 'carro_combustivel_km_padrao',   '{"valor": 650,    "label": "650 km/mês", "fonte": "IBGE — uso médio urbano"}',                           'Quilometragem mensal média urbana', 'seed', 1),
  ('simparam_14', 'carro_consumo_padrao',          '{"valor": 12,     "label": "12 km/l",    "fonte": "INMETRO — eficiência média flex/gasolina"}',           'Consumo médio do veículo em km/l', 'seed', 1),
  ('simparam_15', 'carro_combustivel_preco_padrao','{"valor": 6.20,   "label": "R$ 6,20/l",  "fonte": "ANP — preço médio nacional gasolina (ref. 2025)"}',   'Preço médio do litro de combustível', 'seed', 1),
  ('simparam_16', 'credito_juros_padrao',          '{"valor": 0.1800, "label": "18,00% a.a.", "fonte": "Banco Central — crédito pessoal / CDC médio"}',       'Taxa média de juros crédito pessoa física', 'seed', 1);
