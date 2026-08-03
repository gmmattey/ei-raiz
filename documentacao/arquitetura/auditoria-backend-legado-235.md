# Auditoria do backend patrimonial legado (issue #235)

> Documento de auditoria e decisão. Não é uma ADR de arquitetura nova — registra o estado real
> levantado remotamente na conta Cloudflare em 2026-07-29 e a política pendente de aprovação do
> Luiz para retenção/exportação/descarte. Não contém PII: nomes, e-mails, CPF ou valores
> individuais não aparecem aqui — só contagens agregadas.

## 1. Pré-condições confirmadas

- **Conta Cloudflare:** "Giammattey, Luiz F." — Account ID `2f38f7354f204d7b3f7d6c750b3e43ff`.
- **Worker:** `ei-api-gateway`, config em `servidores/porta-entrada/wrangler.toml`.
- **URL pública:** `https://ei-api-gateway.giammattey-luiz.workers.dev`.
- **Bancos D1 na conta vinculados ao produto patrimonial:** 4 encontrados via `wrangler d1 list`
  (existem outros bancos na conta — `signallq-diagnostic-db`, `signallq-admin-db`, `quanto-db` —
  de outros produtos, fora do escopo desta auditoria).

| Nome | database_id | Ambiente declarado no toml | Vinculado a algum binding ativo? |
|---|---|---|---|
| `esquilo-invest-dev` | `e2a0b0a8-484d-4507-b21c-facf090481dd` | default (`[[d1_databases]]`) | **Sim — é o banco real do Worker em produção** (ver achado abaixo) |
| `esquilo-invest` | `2a4849fa-e980-4540-bd60-514b740287d3` | `env.production` (nominalmente) | **Não** — o `database_id` declarado no toml para este binding está errado (aponta para o id de `esquilo-invest-dev`), então esse binding nunca resolveu para este banco fisicamente |
| `esquilo-invest-hml` | `f7ee1506-ae01-45e4-875d-781042ea3f00` | nenhum | **Não** — não aparece em nenhum `[[d1_databases]]` do `wrangler.toml` atual |
| `quanto-db`, `signallq-*` | — | — | De outros produtos, não auditados aqui |

### Achado crítico 1 — `wrangler.toml` está com `database_id` incorreto para produção

O `wrangler.toml` declara:

```toml
[[d1_databases]]              # binding default (usado por `wrangler deploy`, sem --env)
database_name = "esquilo-invest-dev"
database_id = "e2a0b0a8-484d-4507-b21c-facf090481dd"

[[env.production.d1_databases]]   # binding usado só por `wrangler deploy --env production`
database_name = "esquilo-invest"
database_id = "e2a0b0a8-484d-4507-b21c-facf090481dd"   # ← MESMO id do banco "-dev" acima
```

O binding do D1 no Cloudflare Workers resolve por `database_id`, não por `database_name` (o nome é
só um rótulo local). Confirmado via `wrangler d1 list` + `wrangler d1 info <nome>` em cada um dos
três bancos: o id `e2a0b0a8-...` pertence fisicamente a `esquilo-invest-dev`. O banco realmente
chamado `esquilo-invest` tem id **diferente** (`2a4849fa-...`) e nunca foi de fato bindado — nem
pelo deploy default, nem pelo `env.production`, porque o `wrangler.toml` usa o id errado nos dois
lugares.

### Achado crítico 2 — CI só faz deploy do binding default, nunca de `env.production`

`servidores/porta-entrada/package.json` → script `deploy` = `wrangler deploy` (sem `--env`).
`.github/workflows/deploy.yml` chama `npm run deploy:api`, que roda esse mesmo script. Ou seja:
todo push em `master` sempre implanta usando o binding **default**, que aponta para
`esquilo-invest-dev`. O bloco `[env.production]` do `wrangler.toml` (worker separado, historicamente
com deploys manuais só até 2026-04-20 — ver `wrangler deployments list --env production`) está
**morto**: além do `database_id` errado, `wrangler secret list --env production` retorna lista
vazia (sem `JWT_SECRET`, sem `BRAPI_TOKEN`) — mesmo que alguém rodasse `wrangler deploy --env
production` manualmente, a API não teria como autenticar nada.

**Conclusão prática:** o banco que concentra qualquer dado real de uso do produto é
`esquilo-invest-dev` (fisicamente), apesar do nome sugerir "desenvolvimento". `esquilo-invest`
(o nome "de produção") e `esquilo-invest-hml` estão **órfãos** — não recebem tráfego do Worker
atual há muito tempo.

## 2. Auditoria do Worker (read-only, nada foi alterado)

| Item | Estado atual | Evidência | Risco | Ação recomendada |
|---|---|---|---|---|
| Nome/URL | `ei-api-gateway`, `https://ei-api-gateway.giammattey-luiz.workers.dev` | `wrangler.toml`, `wrangler deployments list` | Baixo | Manter até decisão de desligamento |
| Última implantação | 2026-07-29T03:55:39Z (versão `a850afe9`) | `wrangler deployments list` | — | Decorre do merge da #184 (commit `40c689a`, mesma data) — deploy de código, não de tráfego de usuário |
| Deploy `env.production` | Órfão, último deploy manual em 2026-04-20 | `wrangler deployments list --env production` | Médio — configuração morta e enganosa (nome sugere prod, mas não é usado) | Remover o bloco `[env.production]` do `wrangler.toml` quando o backend for desligado; não vale a pena corrigir o id agora, já que o objetivo final é desligar |
| Cron triggers | Comentados desde 2026-07-23 (limite de 5 crons/conta excedido) | `wrangler.toml` linhas 12-20 | Baixo | Manter desativado |
| Bindings | Só `DB` (D1). Sem KV, R2, Queues apesar do `CLAUDE.md` do repo mencionar cache KV — código de cache (`infra/cache.ts`) não existe mais no `src/infra/` atual | `wrangler.toml`, inspeção de `src/infra/` | Baixo | Nenhuma — doc desatualizada, não é escopo desta issue corrigir |
| Secrets (só nomes) | Default: `ADMIN_TOKEN`, `BRAPI_TOKEN`, `JWT_SECRET`. `env.production`: nenhum | `wrangler secret list` / `wrangler secret list --env production` | Baixo (nomes, não valores, aqui) | Remover ao desligar |
| Tráfego recente | `read_queries_24h` / `write_queries_24h` = 0 nos três bancos (antes desta auditoria); `wrangler tail` sem eventos em ~10s de escuta ao vivo | `wrangler d1 info`, `wrangler tail` | — | Consistente com "sem cliente ativo" — janela de escuta curta, não é prova definitiva isolada, mas corrobora os outros sinais (telemetria parada, sem consumidores no código) |
| Outros consumidores | Nenhum encontrado em `aplicativo/` (app KMP) nem em `apresentacao/` (client HTTP foi removido na #184) | `grep` por `ei-api-gateway`/`esquilo-invest` nos dois diretórios | — | — |
| Resíduo de config | `apresentacao/wrangler.toml` ainda declara `VITE_API_BASE_URL` apontando pro Worker, mas nenhum código da landing consome mais essa variável (cliente HTTP removido na #184) | `apresentacao/wrangler.toml:6` | Baixo | Cosmético — remover junto do desligamento ou em limpeza separada da landing (fora do escopo desta issue) |

## 3. Auditoria dos bancos D1

### `esquilo-invest-dev` (id `e2a0b0a8-...`) — banco fisicamente ativo

- Tabelas: 28 de domínio + `_cf_KV`/`d1_migrations`/`sqlite_sequence` (sistema) = 31 no total, 9 views.
- Tamanho: 422 KB.
- Última atividade real (telemetria): 2026-07-26T02:38:12Z — 3 dias antes do congelamento da #184.

| Tabela | Registros | Data inicial | Data final | Possui dado pessoal? | Possui dado patrimonial? |
|---|---|---|---|---|---|
| `usuarios` | 3 | 2026-04-22 | 2026-07-26 | Sim (nome, e-mail, CPF, hash de senha) | Não |
| `usuario_preferencias` | 0 | — | — | — | — |
| `usuario_plataformas` | 0 | — | — | — | — |
| `recuperacoes_acesso` | 2 | — | — | Indireto (vinculado a `usuario_id`, guarda só PIN com hash) | Não |
| `perfis_financeiros` | 1 | — | — | Sim (renda/aporte mensal são dado financeiro pessoal) | Sim |
| `patrimonio_itens` | 0 | — | — | — | — |
| `patrimonio_aportes` | 0 | — | — | — | — |
| `patrimonio_movimentos` | 0 | — | — | — | — |
| `patrimonio_historico_mensal` | 6 | — | — | Indireto | Sim |
| `patrimonio_scores` | 0 | — | — | — | — |
| `patrimonio_fila_reconstrucao` | 0 | — | — | — | — |
| `importacoes` / `importacao_itens` | 0 / 0 | — | — | — | — |
| `decisoes_simulacoes` | 0 | — | — | — | — |
| `telemetria_eventos` | 39 | 2026-04-22 | 2026-07-26 | Não (payload auditado, sem e-mail/cpf/senha/token nos `dados_json`, 940 bytes total) | Não |
| `admin_usuarios` | 1 | — | — | Sim (conta operacional interna) | Não |
| `admin_auditoria` | 0 | — | — | — | — |
| `ativos`, `ativos_cotacoes_cache`, `fundos_cvm`, `fundos_cvm_cotas`, `corretoras` | 0 cada | — | — | — | — |
| `cvm_execucoes` | 7 | — | — | Não (log técnico de ingestão) | Não |
| `configuracoes_produto`, `feature_flags`, `configuracoes_menu`, `conteudo_blocos`, `job_execucoes` | 0 cada | — | — | — | — |

Nenhuma tabela de sessão/token de API encontrada — autenticação é JWT stateless, não persistido em
D1 (só o hash de PIN de recuperação em `recuperacoes_acesso`).

### `esquilo-invest` (id `2a4849fa-...`) — órfão, sem binding ativo

- Schema atual (26 tabelas, mesma estrutura canônica do `esquilo-invest-dev`, porém sem
  `patrimonio_movimentos` nem `job_execucoes` — schema mais antigo, congelado desde antes dessas
  duas tabelas existirem), 9 views, 352 KB.
- **Totalmente vazio**: `usuarios` = 0, `patrimonio_itens` = 0, `telemetria_eventos` = 0,
  `admin_usuarios` = 0. Confirmado por contagem direta em todas as tabelas-chave.
- Nenhum dado pessoal ou patrimonial. Foi criado em 2026-04-03 e nunca recebeu tráfego real —
  provavelmente uma tentativa anterior de banco "de produção" que ficou órfã quando o
  `database_id` foi copiado errado no `wrangler.toml`.

### `esquilo-invest-hml` (id `f7ee1506-...`) — órfão, schema legado em inglês

- 18 tabelas + 5 views, 332 KB, criado em 2026-03-29.
- Schema **diferente e mais antigo**: nomes em inglês (`users`, `portfolios`, `assets`,
  `portfolio_positions`, `portfolio_contributions`...) — justamente o vocabulário banido pelas
  regras atuais do repo (`AGENTS.md` §7: proibido `portfolio`, `assets`, `posicoes`). Não é
  compatível com as migrations atuais em `infra/banco/migrations/` e não está referenciado em
  nenhum `wrangler.toml` do monorepo.
- `users`: 1 registro, criado em 2026-03-29T18:06:44 — poucos minutos após a criação do próprio
  banco (17:53:58). Schema desse `users` **não tem colunas de nome/e-mail/CPF** — só
  `id`, `auth_provider_id`, `device_id` (identificador pseudonimizado de dispositivo/dev).
  `portfolios` = 1, `portfolio_positions` = 15, `portfolio_contributions` = 0.
- Leitura: é um banco de desenvolvimento inicial (seed técnico de dispositivo, sem PII
  identificável), da fase pré-refatoração do schema atual. Consistente com dado de teste técnico
  (categoria A), não com usuário real.

## 4. Usuários reais (agregado, sem PII)

Contando só o banco fisicamente ativo (`esquilo-invest-dev`) — os outros dois estão vazios de
usuários ou sem PII identificável (ver seção 3):

- **3 usuários únicos** cadastrados no total.
- **1 usuário com patrimônio cadastrado** (1 `perfil_financeiro`, 0 `patrimonio_itens` — ou seja,
  preencheu perfil financeiro mas não chegou a registrar nenhum ativo).
- **2 usuários** correspondem ao padrão de nome/e-mail do próprio Luiz (mesmo domínio, mesmo
  padrão de nome) — confirmado sem exibir os valores brutos, só por `LIKE` agregado.
- **1 usuário não corresponde a esse padrão** — criado em 2026-04-22, nunca mais atualizado
  (`atualizado_em` = `criado_em`), sem perfil financeiro, sem itens patrimoniais, sem CPF/e-mail
  que bata com padrão de teste/interno (`test`, `qa`, `demo`, `example`, domínios internos) — não
  dá pra classificar como seed técnico com segurança. **Tratar como terceiro real até prova em
  contrário.**
- Nenhum indício de conta dev/teste explícita nesse banco (nenhum e-mail com `test`/`teste`/
  `example`/domínio interno).
- Telemetria mostra atividade dos 3 usuários (`usuarios_distintos` = 3 em `telemetria_eventos`),
  última em 2026-07-26 — 3 dias antes do congelamento.

Nenhum detalhe adicional (e-mail, nome, CPF) foi salvo em arquivo local — as consultas feitas
foram só de contagem/padrão agregado; uma tentativa de consultar o nome bruto do terceiro foi
bloqueada pelo próprio sistema de permissões da sessão, o que é o comportamento correto aqui.
Se for necessário confirmar a identidade desse terceiro para decidir exportação/contato, é o Luiz
quem tem acesso natural para olhar essa única linha — não delego essa leitura.

## 5. Classificação dos dados

| Categoria | Onde está | Volume | Recomendação |
|---|---|---|---|
| A) Dados de teste/técnicos | `esquilo-invest-hml` inteiro (schema legado, 1 "usuário" pseudonimizado sem PII, 15 posições de teste); tabelas vazias de catálogo (`ativos`, `fundos_cvm`, etc.) em todos os bancos; `esquilo-invest` inteiro (vazio) | 3 bancos/schemas sem dado pessoal relevante | Descartar — não há razão para reter, não há PII, não há valor de produto (schema incompatível com o atual) |
| B) Dados do próprio Luiz | 2 de 3 `usuarios` em `esquilo-invest-dev`, o único `perfil_financeiro`, a maior parte da `telemetria_eventos` e `admin_usuarios` | Pequeno (poucas linhas) | Exportar (se o Luiz quiser manter histórico) e depois pode descartar do D1 — dado dele mesmo, decisão dele sem risco de terceiro |
| C) Dados de terceiros reais | 1 `usuario` em `esquilo-invest-dev` não identificado como Luiz nem como teste (nome, e-mail, CPF, hash de senha — sem patrimônio) | 1 registro | **Não descartar sem plano de exportação/aviso** — mesmo sendo 1 registro só, tem CPF e e-mail reais potencialmente. Exportar isoladamente ou obter confirmação do Luiz sobre a identidade antes do descarte |
| D) Dados técnicos (logs/telemetria/migrations) | `telemetria_eventos` (39, payload auditado sem PII), `cvm_execucoes` (7), `d1_migrations`, `job_execucoes` (vazio) | Pequeno | Descartar junto com o banco — sem valor de retenção isolado |

## 6. Exportação — requisitos e validação do procedimento

Formato recomendado para uma eventual exportação administrativa definitiva: **dump SQL completo
via `wrangler d1 export --remote`** (inclui schema + dados, formato replicável em SQLite local),
mais um subconjunto filtrado por `usuario_id` se for necessário isolar só os dados do terceiro
identificado na seção 4/5-C.

Requisitos para a exportação definitiva (ainda não executada):
- Rodar com `--remote` (garante consistência com o banco de produção física, `esquilo-invest-dev`).
- Calcular hash SHA-256 do arquivo exportado imediatamente após a exportação e registrar hash +
  data + origem (`database_id`) num log local, fora do repositório.
- Nunca commitar o dump no git nem subir para serviço público (Notion, Slack, etc.) — guardar
  criptografado em local de acesso restrito ao Luiz (ex.: gerenciador de senhas com anexo, ou
  disco local criptografado).
- Migrations incluídas no dump automaticamente (é um export completo do banco, não só dados).

**Validação feita nesta auditoria:** rodei `wrangler d1 export esquilo-invest-dev --remote
--output <arquivo temporário fora do repo>`. Funcionou (41 KB, 101 `INSERT INTO`, hash SHA-256
calculado). Arquivo apagado logo em seguida (`rm`), sem deixar rastro em log nem no repositório —
só validei que o procedimento técnico funciona. **Não fiz a exportação definitiva.**

## 7. Política recomendada

Cenário real encontrado: **existem terceiros** (categoria C da seção 5) — ainda que seja um único
registro sem dado patrimonial, tem CPF e e-mail reais e não pode ser tratado como se não existisse.
Isso descarta o cenário mais simples ("só dados do Luiz") e exige o cenário mais conservador dos
três do roteiro original:

- Notificar/confirmar (a critério do Luiz, já que ele tem acesso natural para identificar esse
  registro) antes de qualquer descarte definitivo dos dados desse terceiro.
- Oferecer exportação ao terceiro se for identificável e contatável — ou reter por um prazo curto
  e objetivo (seção 8) e então anonimizar/descartar se não houver contato possível.
- Para os dados do próprio Luiz (categoria B): livre para exportar e descartar do D1 quando ele
  quiser, sem essa restrição.
- Para os bancos órfãos (`esquilo-invest`, `esquilo-invest-hml`) e dados técnicos (categoria A/D):
  sem restrição — podem ser descartados assim que a decisão de desligamento for autorizada, não
  dependem do terceiro.

## 8. Retenção proposta

- **Início da contagem:** data desta auditoria, 2026-07-29.
- **Prazo proposto:** 30 dias corridos a partir de 2026-07-29 (até **2026-08-28**) para o Luiz
  confirmar a identidade do terceiro encontrado na seção 4 e decidir entre exportar/notificar ou
  autorizar descarte direto.
- **Quem autoriza:** Luiz — nem eu nem qualquer outro agente decide descarte de dado de terceiro
  sozinho.
- **Condição para descarte:** prazo vencido sem necessidade de contato (ex.: Luiz confirma que é
  conhecido/beta tester e não requer notificação formal) OU exportação/notificação concluída.
- **Condição para abortar o descarte:** identificação de que o terceiro é um usuário que pode
  querer reativar o produto, ou instrução explícita do Luiz para estender o prazo.
- Bancos órfãos sem PII (`esquilo-invest`, `esquilo-invest-hml`) não precisam desse prazo — podem
  ser descartados assim que autorizado, independente do prazo do terceiro.

## 9. Segurança e LGPD (nível técnico)

- **Dados pessoais existentes:** nome, e-mail, CPF (3 usuários no banco ativo, sendo 2 do Luiz e
  1 terceiro), renda/aporte mensal (1 perfil financeiro, do Luiz).
- **Dados patrimoniais existentes:** só o histórico mensal consolidado (6 linhas) vinculado ao
  perfil do Luiz — nenhum item patrimonial individual cadastrado (`patrimonio_itens` = 0 em todos
  os bancos ativos).
- **CPF armazenado sem sufixo `_hash`** — pela convenção de nomenclatura do próprio repo
  (`AGENTS.md` §7, "hashes terminam em `_hash`"), a coluna `cpf` em `usuarios` não segue esse
  padrão, ou seja, é armazenada em claro (não hash/criptografada) no schema atual. Isso é uma
  característica herdada do produto congelado — não é uma mudança desta auditoria, mas é um risco
  técnico relevante a registrar: enquanto o banco existir, há CPF em texto claro em repouso no D1.
  Reforça a recomendação de descarte/anonimização em vez de retenção longa.
- **Tokens/sessões no D1:** não encontrados — autenticação é JWT stateless; só há hash de PIN de
  recuperação de senha (`recuperacoes_acesso.pin_hash`), que é o padrão correto.
  `wrangler secret list` confirma que segredos (`JWT_SECRET`, `BRAPI_TOKEN`, `ADMIN_TOKEN`) vivem
  no secret store do Worker, não em nenhuma tabela do D1.
  Nomes verificados — nunca os valores.
- **Logs com payload sensível:** `telemetria_eventos.dados_json` auditado (39 linhas, 940 bytes
  no total) — sem ocorrência de padrões `email`/`cpf`/`senha`/`token` nos payloads.
- **Backups antigos:** os dois bancos órfãos (`esquilo-invest`, `esquilo-invest-hml`) funcionam de
  fato como "backups acidentais" de tentativas anteriores — um vazio, outro com schema legado sem
  PII relevante.
- **Base legal / finalidade da retenção (nível prático, não parecer jurídico):** o produto
  patrimonial que coletou esses dados foi descontinuado (#184). Não há finalidade de produto ativa
  para reter esses dados hoje — a única finalidade atual é permitir que o próprio titular (Luiz ou
  o terceiro identificado) solicite exportação antes do descarte. Isso é o que justifica o prazo
  curto e objetivo da seção 8, em vez de retenção indefinida.

## 10. Plano de desligamento (preparado, não executado)

Sequência futura, só a ser executada após autorização explícita do Luiz e cumprido o prazo/decisão
da seção 8:

1. Exportar definitivamente `esquilo-invest-dev` (dump SQL completo via `wrangler d1 export --remote`).
2. Calcular e registrar hash SHA-256 do dump, fora do repositório.
3. Validar a exportação (reabrir localmente com SQLite, conferir contagens batem com o banco remoto).
4. Congelar escrita no D1 (não há escrita ativa hoje, mas confirmar explicitamente antes de seguir).
5. Confirmar ausência de tráfego (nova janela de `wrangler tail` mais longa, checar `read/write_queries_24h` = 0 de novo, checar telemetria sem novo evento).
6. Remover deploy automático do backend do `.github/workflows/deploy.yml` (tirar o step "Deploy Backend to Cloudflare Workers").
7. Despublicar/deletar o Worker `ei-api-gateway` (`wrangler delete`).
8. Remover os secrets do Worker (`ADMIN_TOKEN`, `BRAPI_TOKEN`, `JWT_SECRET`).
9. Apagar os bancos D1 (`esquilo-invest-dev`, `esquilo-invest`, `esquilo-invest-hml`) — só depois do passo 1-3 confirmados.
10. Remover `servidores/porta-entrada/`, `infra/banco/`, `bibliotecas/contratos/` (se só usados pelo backend legado) e demais contratos/rotas legados do repositório.
11. Validar que a landing (`apresentacao/`) e o app KMP (`aplicativo/`) continuam funcionando sem nenhuma referência ao backend removido (checar `VITE_API_BASE_URL` residual mencionado na seção 2).
12. Fechar #235 e #184.

Se, após a decisão do Luiz, ficar confirmado que a execução deve acontecer, a recomendação é abrir
**uma única issue complementar** `[Task] Executar descarte e desligamento do backend patrimonial
legado` — não abro essa issue nesta rodada, é decisão do Luiz.
