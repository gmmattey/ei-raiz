# Operação — Histórico mensal e reconstrução retroativa

Guia do que rodar **uma vez em produção** após o merge desta entrega.
Tudo é idempotente — pode ser executado várias vezes sem efeito colateral.

## 1. Aplicar migrations 024 e 025

Cria as tabelas `historico_carteira_mensal` e `fila_reconstrucao_carteira`.

```bash
# Ambiente local
cd apps/api
npx wrangler d1 migrations apply esquilo-invest-dev --local

# Produção (remote)
npx wrangler d1 migrations apply esquilo-invest-dev --remote
```

Verificação rápida após aplicar:

```bash
npx wrangler d1 execute esquilo-invest-dev --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'historico%' OR name LIKE 'fila%';"
```

Saída esperada conter `historico_carteira_mensal` e `fila_reconstrucao_carteira`.

## 2. Disparar reconstrução retroativa para usuários existentes

Três rotas administrativas — exigem `Authorization: Bearer <token-admin>` e header
`x-admin-token: <ADMIN_TOKEN>`.

### 2.1 Status agregado (sempre seguro de chamar)

```bash
curl -X GET "$API_BASE/api/admin/historico/reconstruir/status" \
  -H "Authorization: Bearer $ADMIN_BEARER" \
  -H "x-admin-token: $ADMIN_TOKEN"
```

Resposta:

```json
{
  "ok": true,
  "dados": {
    "totais": { "pendente": 0, "processando": 0, "concluido": 0, "erro": 0 },
    "usuariosComAtivos": 0,
    "faltamEnfileirar": 0
  }
}
```

### 2.2 Enfileirar todos os usuários com ativos (uma vez)

```bash
curl -X POST "$API_BASE/api/admin/historico/reconstruir/enfileirar-todos" \
  -H "Authorization: Bearer $ADMIN_BEARER" \
  -H "x-admin-token: $ADMIN_TOKEN"
```

Cria 1 registro em `fila_reconstrucao_carteira` por usuário, identificando o
mês mais antigo automaticamente a partir de `ativos.data_aquisicao`.

### 2.3 Processar lotes (rodar em loop até zerar pendentes)

Cada chamada processa **6 meses por usuário pendente** (ajustável via body
`{"tamanhoLote": N}`, máx 12).

```bash
# Processa um lote para todos os pendentes
curl -X POST "$API_BASE/api/admin/historico/reconstruir/processar-todos" \
  -H "Authorization: Bearer $ADMIN_BEARER" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"tamanhoLote": 6}'
```

Resposta:

```json
{
  "ok": true,
  "dados": {
    "processados": 12,
    "concluidosAgora": 3,
    "restantes": 9,
    "erros": []
  }
}
```

Repita até `restantes = 0`. Exemplo de loop bash:

```bash
while true; do
  STATUS=$(curl -s -X POST "$API_BASE/api/admin/historico/reconstruir/processar-todos" \
    -H "Authorization: Bearer $ADMIN_BEARER" \
    -H "x-admin-token: $ADMIN_TOKEN" \
    -H "content-type: application/json" -d '{"tamanhoLote": 6}')
  echo "$STATUS"
  RESTANTES=$(echo "$STATUS" | jq -r '.dados.restantes')
  [ "$RESTANTES" = "0" ] && break
  sleep 5
done
```

## 3. Cron D-1 de fechamento mensal

Já configurado em `apps/api/wrangler.toml`:

```toml
[[triggers]]
crons = ["*/5 * * * *", "0 3 * * *"]
```

- `*/5 * * * *` → refresh de cotações de mercado (já existia)
- `0 3 * * *` → fechamento mensal D-1 (novo) — grava 1 ponto em
  `historico_carteira_mensal` por usuário às 03:00 UTC todo dia. Idempotente
  por `(usuario_id, ano_mes)` — sobrescreve o ponto do mês corrente até virar.

## 4. Rotas de leitura disponíveis

| Endpoint | Quem usa |
|---|---|
| `GET /api/historico/mensal?limite=24` | gráfico de evolução em `Historico.jsx` (já adaptado) |
| `GET /api/historico/mensal/{YYYY-MM}` | drill-down de um mês específico |
| `GET /api/historico/reconstrucao` | progresso da reconstrução do usuário logado |
| `POST /api/historico/reconstrucao` | enfileira reconstrução do próprio usuário (chamada por usuários, não admin) |
| `POST /api/historico/reconstrucao/processar` | processa próximo lote do próprio usuário |

## 5. Limitações conhecidas (intencionais nesta entrega)

- **Aportes incrementais não são reconstruídos por data**: o schema atual não
  guarda quando cada lote de quantidade entrou. A reconstrução assume que a
  `quantidade` atual existia desde `data_aquisicao`.
- **Variação de mercado histórica para tickers BRAPI** já é aplicada: o
  `ServicoReconstrucaoCarteira` consulta `MarketDataService.getHistory(ticker, "10y", "1mo")`
  uma vez por lote e usa o `close` mensal real para ações/ETFs/BDRs. Sem
  `BRAPI_TOKEN` ou para ativos sem ticker (FIIs por CNPJ, fundos, criptos),
  cai no fallback `quantidade × precoMedio`.
- **Bens e poupança usam valores atuais**: não há histórico desses campos no
  schema. Próxima evolução opcional: registrar snapshots periódicos de
  `perfil_contexto_financeiro`.
- **`portfolio_snapshots` não foi alterada**: continua como estado atual da
  carteira. Será deprecada apenas quando 100% dos usuários tiverem reconstrução
  concluída e o frontend tiver migrado totalmente.
