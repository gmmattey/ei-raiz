INSERT INTO asset_types (id, code, name, sort_order) VALUES
  ('asset_type_acoes', 'acoes', 'Ações', 10),
  ('asset_type_fundos', 'fundos', 'Fundos', 20),
  ('asset_type_previdencia', 'previdencia', 'Previdência', 30);

INSERT INTO platforms (id, code, name, platform_kind) VALUES
  ('platform_xp', 'xp', 'XP', 'broker'),
  ('platform_ion', 'ion', 'Íon', 'broker'),
  ('platform_tim_prev', 'tim_previdencia', 'TIM Previdência', 'pension');
