-- Quanto · Seed data
-- User: Luiz (primeiro login via Cloudflare Access)

INSERT OR IGNORE INTO users (email) VALUES ('giammattey.luiz@gmail.com');

-- XP · Acoes (auto)
INSERT INTO assets (user_id,institution,class,name,ticker,qty,invested,status)
VALUES
  (1,'XP','ACAO','CPLE3 · Copel','CPLE3',28,373.52,'active'),
  (1,'XP','ACAO','ITSA4 · Itausa','ITSA4',27,373.68,'active'),
  (1,'XP','ACAO','RANI3 · Irani','RANI3',41,373.10,'active');

-- XP · Ativos manuais
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'XP','PREVIDENCIA','AZ Quest Luce Icatu Prev PGBL',10000.00,12362.16,'2026-06-12','active'),
  (1,'XP','FUNDO','Western Asset US Index 500 FIF',4150.21,4562.77,'2026-06-12','active'),
  (1,'XP','FUNDO','ACE Capital Multicenarios FC FIF',1447.64,1478.02,'2026-06-12','active'),
  (1,'XP','FUNDO','Trend Ouro FIF Multi RL',952.87,1261.60,'2026-06-12','active');

-- XP · Em resgate
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'XP','FUNDO','Selection RF Light FIC FIRF CP LP',984.64,1099.50,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Legacy Capital Compound Advisory',1900.00,1999.63,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Trend Valor Brasil FIA RL',750.00,877.10,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Trend Fixed Income US Target Duration',124.33,135.09,'2026-06-12','redeeming');

-- Itau/ION · Acao (auto)
INSERT INTO assets (user_id,institution,class,name,ticker,qty,invested,status)
VALUES (1,'ITAU','ACAO','BRST3 · BrasilAgro','BRST3',200,586.15,'active');

-- Itau/ION · Manuais
INSERT INTO assets (user_id,institution,class,name,manual_balance,balance_updated_at,status)
VALUES
  (1,'ITAU','PREVIDENCIA','Itau Kinea Andes Prev RF CP PGBL',30566.46,'2026-06-12','active'),
  (1,'ITAU','COFRINHO','Cofrinhos ION',21867.67,'2026-06-12','active'),
  (1,'ITAU','FUNDO','Itau Kinea Andes RF CP LP',2568.37,'2026-06-12','active'),
  (1,'ITAU','POUPANCA','Poupanca MULTIDATA',302.01,'2026-06-12','active');

-- Onze · Previdencia
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'ONZE','PREVIDENCIA','Schroder Icatu Prev Low Vol Multimercado',23968.24,23968.24,'2026-06-12','active'),
  (1,'ONZE','PREVIDENCIA','Icatu Seg FIC Empresarial Renda Fixa',8432.36,8432.36,'2026-06-12','active'),
  (1,'ONZE','PREVIDENCIA','Icatu Vanguarda Pos Fixado RF Prev',50160.95,50160.95,'2026-05-09','active');
-- Nota: Icatu Vanguarda tem balance_updated_at antiga -> stale no frescor
