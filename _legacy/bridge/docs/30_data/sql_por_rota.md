# SQL por rota — Documento assistido

## Import start — sessão com gate de onboarding
```sql
SELECT
  s.user_id AS userId,
  p.id AS portfolioId,
  CASE
    WHEN c.financial_goal IS NOT NULL AND c.financial_goal <> ''
     AND COALESCE(c.risk_profile_effective, c.risk_profile) IS NOT NULL
     AND COALESCE(c.risk_profile_effective, c.risk_profile) <> ''
    THEN 1
    ELSE 0
  END AS hasContext
FROM auth_sessions s
LEFT JOIN portfolios p ON p.user_id = s.user_id AND p.is_primary = 1
LEFT JOIN user_financial_context c ON c.user_id = s.user_id
WHERE s.session_token_hash = ?
  AND s.revoked_at IS NULL
  AND s.expires_at > CURRENT_TIMESTAMP
LIMIT 1;
```

## Import start — persistência do preview assistido
```sql
INSERT INTO imports (
  id, user_id, portfolio_id, status, origin, total_rows, valid_rows, invalid_rows, duplicate_rows, created_at, started_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

```sql
DELETE FROM import_rows WHERE import_id = ?;
```

```sql
INSERT INTO import_rows (
  id, import_id, row_number, source_payload_json, normalized_payload_json, resolution_status, error_message, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
```

## Import preview — leitura com origem/confiança por campo
```sql
SELECT id, row_number, source_payload_json, normalized_payload_json, resolution_status, error_message
FROM import_rows
WHERE import_id = ?
ORDER BY row_number ASC;
```

## Regras da etapa
- origem: DOCUMENT_AI_PARSE
- um arquivo por vez
- tipos aceitos: PDF, imagem e DOCX
- parser por regra vem antes da IA
- documento não importável bloqueia commit
- pendência crítica bloqueia commit
- preview exibe origem do campo: rule, ai ou manual
