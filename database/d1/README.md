# D1

> ✅ **Esta pasta é a fonte de verdade do schema.** Qualquer alteração de tabela, relação ou índice deve ser feita aqui.

Esta pasta é a fonte oficial do schema do domínio no D1.

Regra:

- decisão de tabela, relação e índice nasce aqui
- seed, migration e view de apoio também pertencem aqui
- se houver divergência com qualquer outro local, prevalece o que estiver nesta pasta
- o `schema.sql` do starter (`04_STARTER_BACKEND/`) é apenas um aviso de redirecionamento — não editar lá

## Como aplicar

Ver `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/ENVIRONMENTS.md` para os comandos completos.

Resumo:

```bash
npx wrangler d1 execute esquilo-invest-local \
  --env local \
  --file=database/d1/schema.sql \
  --remote
```

## Conteúdo esperado

- `schema.sql` — fonte canônica de todas as tabelas e índices
- `migrations/` — alterações incrementais futuras
- views e scripts de apoio
