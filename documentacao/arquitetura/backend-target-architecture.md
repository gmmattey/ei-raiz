# Backend Target Architecture

Destino final do backend após o rebuild. Documento de referência. Para o plano de execução, ver `backend-rebuild-plan.md`. Para o baseline pré-refactor, ver `backend-inventory.md`.

---

## Princípios

1. **Uma coisa = um nome.** Nomenclatura única por conceito. PT-BR em todo o domínio do produto.
2. **Uma tela = poucas APIs coesas.** Cada tela consome 1-3 endpoints consolidados.
3. **View quando leitura derivada bastar.** Tabela real só com justificativa técnica (dado transacional, fila, cache materializado legítimo, histórico temporal, checkpoint, auditoria).
4. **Camadas invioláveis.** SQL só em repositórios. Regra só em serviços. I/O fora de cálculos.
5. **Zero compatibilidade vestigial.** Greenfield significa sem adapters, sem fallbacks, sem rotas legadas co-existindo.

---

## Domínios públicos (6) + Admin

| Domínio | Responsabilidade | Sub-recursos | Tela UI |
|---------|-----------------|--------------|---------|
| `auth` | login, cadastro, sessão, recuperação | — | Login, Cadastro |
| `usuario` | conta, preferências, plataformas | `preferencias`, `plataformas` | Perfil (conta) |
| `perfil` | renda, aporte, horizonte, risco, objetivos | — | Perfil (financeiro) |
| `patrimonio` | itens, aportes, histórico, score, importação | `itens`, `aportes`, `historico`, `score`, `importacoes` | Home, Carteira, DetalheAtivo, Aportes, Historico, Importar, Insights |
| `mercado` | catálogo ativos, cotações, fundos CVM, FIPE | `ativos`, `fundos-cvm`, `fipe` | DetalheAtivo (seções externas) |
| `decisoes` | simulações, Vera (IA) | `simulacoes`, `vera` | Decisões, PropertySimulator, CarSimulator |
| `admin` | operação interna | `usuarios`, `cvm`, `conteudo`, `flags`, `configuracoes`, `auditoria` | PainelAdmin |

---

## Banco — 26 tabelas + 9 views

### Por domínio

**auth / usuario**
- `usuarios` — PK(id)
- `usuario_preferencias` — PK(usuario_id, chave), FK→usuarios CASCADE
- `usuario_plataformas` — FK→usuarios CASCADE, FK→corretoras RESTRICT
- `recuperacoes_acesso` — FK→usuarios CASCADE

**perfil**
- `perfis_financeiros` — PK(usuario_id) = FK→usuarios CASCADE

**patrimonio**
- `patrimonio_itens` — FK→usuarios CASCADE, FK→ativos SET NULL. Colapsa `ativos` (usuario-scoped) + `posicoes_financeiras` + contexto do `perfil_contexto_financeiro`.
- `patrimonio_aportes` — FK→usuarios CASCADE, FK→patrimonio_itens SET NULL. Colapsa `aportes` + `ativos_movimentacoes`.
- `patrimonio_historico_mensal` — PK(usuario_id, ano_mes), FK→usuarios CASCADE. Colunas tipadas (patrimonio_bruto_brl, patrimonio_liquido_brl, divida_brl) + `dados_json` para extensão.
- `patrimonio_scores` — FK→usuarios CASCADE. Série temporal de scores.
- `patrimonio_fila_reconstrucao` — FK→usuarios CASCADE.
- `importacoes` — FK→usuarios CASCADE.
- `importacao_itens` — FK→importacoes CASCADE.

**mercado**
- `ativos` — catálogo puro, sem `usuario_id`. UQ(ticker), UQ(cnpj).
- `ativos_cotacoes_cache` — PK(ativo_id, fonte).
- `fundos_cvm` — PK(cnpj).
- `fundos_cvm_cotas` — PK(cnpj, data).
- `corretoras` — PK(id).

**decisoes**
- `decisoes_simulacoes` — FK→usuarios CASCADE.

**telemetria**
- `telemetria_eventos` — FK→usuarios SET NULL.

**admin**
- `admin_usuarios` — PK(email).
- `admin_auditoria` — PK(id).
- `configuracoes_produto` — PK(chave).
- `feature_flags` — PK(chave).
- `configuracoes_menu` — PK(id).
- `conteudo_blocos` — PK(chave).
- `cvm_execucoes` — PK(id). Funde `cvm_ingestion_runs` + `cvm_backfill_runs` com coluna `modo`.

### Views

| View | Fontes | Consumida por |
|------|--------|---------------|
| `vw_patrimonio_resumo` | `patrimonio_itens` + último `patrimonio_scores` + último `patrimonio_historico_mensal` + SUM aportes mês | Home |
| `vw_patrimonio_posicoes` | `patrimonio_itens` + `ativos` + `ativos_cotacoes_cache` | Carteira lista, DetalheAtivo |
| `vw_patrimonio_alocacao` | `patrimonio_itens` agregado por classe/subclasse | Carteira donut |
| `vw_patrimonio_evolucao_mensal` | `patrimonio_historico_mensal` últimos 24 meses | Home gráfico, Historico |
| `vw_patrimonio_aportes_mes` | `patrimonio_aportes` agregado por mês | Aportes |
| `vw_patrimonio_score_atual` | último `patrimonio_scores` por usuário | Home, Insights |
| `vw_patrimonio_score_historico` | série de `patrimonio_scores` por mês | Insights |
| `vw_mercado_ativo_detalhe` | `ativos` + `ativos_cotacoes_cache` + `fundos_cvm` | DetalheAtivo |
| `vw_admin_ingestao_cvm` | `cvm_execucoes` agregado | Admin CVM |

### Regras de integridade

- Toda `usuario_id` → FK → `usuarios` **ON DELETE CASCADE**.
- Toda FK tem ON DELETE explícito: `CASCADE` | `SET NULL` | `RESTRICT`.
- Índices: todo `usuario_id`, pares `(usuario_id, criado_em|data|ano_mes)`, `ativos(ticker)`, `ativos(cnpj)`, `fundos_cvm_cotas(cnpj, data)`.

### Colunas JSON permitidas (9 no total)

Justificativas (payload opaco, cardinalidade alta, log auditável):
- `ativos.aliases_json` — lista curta, sem query.
- `patrimonio_itens.dados_json` — extensões por tipo (imóvel: endereço; veículo: marca/modelo; dívida: credor).
- `importacao_itens.dados_json` — payload bruto auditável.
- `decisoes_simulacoes.premissas_json`, `decisoes_simulacoes.resultado_json` — I/O opaco de simulação.
- `patrimonio_scores.pilares_json`, `patrimonio_scores.inputs_resumo_json` — estrutura estável, lida inteira.
- `patrimonio_historico_mensal.dados_json` — extensão após colunas tipadas principais.
- `ativos_cotacoes_cache.dados_json` — payload opaco de provedor.
- `telemetria_eventos.dados_json` — log de evento.

Tudo mais **normaliza**.

---

## API pública — 36 endpoints

### auth (7)
- `POST /api/auth/registrar`
- `POST /api/auth/entrar`
- `POST /api/auth/sair`
- `GET  /api/auth/sessao`
- `POST /api/auth/recuperar/iniciar`
- `POST /api/auth/recuperar/confirmar`
- `POST /api/auth/recuperar/redefinir`

### usuario (4)
- `GET   /api/usuario`
- `PATCH /api/usuario`
- `GET   /api/usuario/preferencias`
- `PATCH /api/usuario/preferencias`

### perfil (2)
- `GET /api/perfil`
- `PUT /api/perfil`

### patrimonio (13)
- `GET    /api/patrimonio/resumo`
- `GET    /api/patrimonio/itens`
- `POST   /api/patrimonio/itens`
- `GET    /api/patrimonio/itens/:id`
- `PATCH  /api/patrimonio/itens/:id`
- `DELETE /api/patrimonio/itens/:id`
- `GET    /api/patrimonio/aportes`
- `POST   /api/patrimonio/aportes`
- `DELETE /api/patrimonio/aportes/:id`
- `GET    /api/patrimonio/historico`
- `GET    /api/patrimonio/score`
- `POST   /api/patrimonio/importacoes`
- `GET    /api/patrimonio/importacoes/:id`

### mercado (4)
- `GET /api/mercado/ativos` (`?q=`)
- `GET /api/mercado/ativos/:ticker`
- `GET /api/mercado/ativos/:ticker/historico`
- `GET /api/mercado/fundos-cvm/:cnpj`

### decisoes (4)
- `GET  /api/decisoes/simulacoes`
- `POST /api/decisoes/simulacoes`
- `GET  /api/decisoes/simulacoes/:id`
- `POST /api/decisoes/vera/mensagens`

### telemetria (1)
- `POST /api/telemetria/eventos`

### admin (1 público + sub-recursos internos)
- `POST /api/admin/entrar`
- Recursos internos: `/api/admin/usuarios/*`, `/api/admin/cvm/*`, `/api/admin/conteudo/*`, `/api/admin/flags/*`, `/api/admin/configuracoes/*`, `/api/admin/auditoria/*`.

---

## Mapa tela → endpoints

| Tela | Endpoints | # |
|------|-----------|---|
| Home | `GET /patrimonio/resumo` | 1 |
| Carteira | `GET /patrimonio/resumo`, `GET /patrimonio/itens` | 2 |
| DetalheAtivo | `GET /patrimonio/itens/:id`, `GET /mercado/ativos/:ticker/historico` | 2 |
| Insights | `GET /patrimonio/score`, `GET /patrimonio/historico` | 2 |
| Aportes | `GET /patrimonio/aportes`, `POST /patrimonio/aportes` | 2 |
| Perfil | `GET /perfil`, `PUT /perfil` | 2 |
| Decisoes | `GET /decisoes/simulacoes`, `POST /decisoes/simulacoes` | 2 |
| Importar | `POST /patrimonio/importacoes`, `GET /patrimonio/importacoes/:id` | 2 |
| Historico | `GET /patrimonio/historico` | 1 |
| Admin | 3 endpoints admin | 3 |

---

## Organização do código

```
servidores/porta-entrada/src/
  index.ts
  aplicacao.ts
  middleware/
    autenticacao.ts
    erro.ts
    telemetria.ts
  dominios/
    auth/
      auth.rotas.ts
      auth.servico.ts
      auth.repositorio.ts
    usuario/
      usuario.rotas.ts
      usuario.servico.ts
      usuario.repositorio.ts
    perfil/
      perfil.rotas.ts
      perfil.servico.ts
      perfil.repositorio.ts
    patrimonio/
      patrimonio.rotas.ts
      patrimonio.servico.ts
      patrimonio.repositorio.ts
      aporte.servico.ts
      importacao.servico.ts
      calculos/
        score.ts
        rentabilidade.ts
        alocacao.ts
    mercado/
      mercado.rotas.ts
      mercado.servico.ts
      mercado.repositorio.ts
      provedores/
        brapi.ts
        cvm.ts
        fipe.ts
    decisoes/
      decisoes.rotas.ts
      simulacao.servico.ts
      vera/
        vera.servico.ts
    admin/
      admin.rotas.ts
      admin.servico.ts
      admin.repositorio.ts
  infra/
    bd.ts
    cache.ts
    http.ts
    fila.ts
  jobs/
    mercado-atualizar.job.ts
    historico-mensal.job.ts
    patrimonio-reconstruir.job.ts
  views/
```

Pasta `servidores/modulos-backend/` **não existe** — todo código vive em `porta-entrada/src/dominios/`.

### Regras de camada
| Camada | Pode | Não pode |
|--------|------|----------|
| rotas | validar input (zod), chamar serviço, formatar resposta | SQL, regra, HTTP externo |
| serviços | orquestrar regra, chamar repos/provedores/cálculos | SQL direto |
| repositórios | SQL cru, mapear linha→DTO | regra, HTTP externo |
| cálculos | funções puras de domínio | I/O |
| provedores | HTTP externo | banco |
| jobs | orquestrar serviços em cron | regra própria |

---

## Nomenclatura oficial

### Banco
- Tabelas: **snake_case**, **plural**.
- Colunas: **snake_case**; sufixos `_id`, `_em`, `_pct`, `_brl`, `_json`, `_hash`.
- Booleans: `eh_` / `esta_` / `_ativo`.

### TypeScript
- DTOs: **camelCase**.
- Tipos: **PascalCase**; sufixos `Dto`, `Entrada`, `Saida`, `Filtro`, `Resumo`.
- Contratos: 1 arquivo por domínio em `bibliotecas/contratos/`.
- Mapeamento snake↔camel **apenas em repositórios**.

### Rotas
- **kebab-case**; prefixo `/api/<dominio>/...`; verbos HTTP puros.

### Telemetria
- `dominio.recurso.acao` (`patrimonio.item.criado`, `auth.sessao.iniciada`).

### Jobs
- `<dominio>-<acao>.job.ts`.

### Palavras banidas
portfolio, financial, financial-core, core, insights, analytics, carteira (como domínio), assets, posicoes, snapshot (como tabela operacional), unified, _v2, retorno_12m.

---

## Frontend — integração

### Clientes API (10)
- `auth.ts`, `usuario.ts`, `perfil.ts`, `patrimonio.ts`, `mercado.ts`, `decisoes.ts`, `admin.ts`, `telemetria.ts`, `http.ts` (infra), `authStorage.ts` (infra).

### Regras
- Nenhum fallback cascata (`*ComFallback` não existe).
- Nenhum mapeamento inline snake↔camel no cliente — contratos já chegam em camelCase.
- Nenhuma agregação manual em telas (Home renderiza direto o que `vw_patrimonio_resumo` entregou).
- JSX/Tailwind/layout **inalterados**. Apenas imports de cliente mudam.

---

## Jobs

| Job | Cron | Responsabilidade |
|-----|------|------------------|
| `mercado-atualizar` | `*/5 * * * *` | Atualiza `ativos_cotacoes_cache` via BRAPI |
| `historico-mensal` | `0 3 * * *` | Gera linha em `patrimonio_historico_mensal` para cada usuário ativo |
| `patrimonio-reconstruir` | queue | Processa `patrimonio_fila_reconstrucao` |

---

## Critérios de "pronto"

1. Tabelas ≤ 26, views ≥ 9.
2. Rotas públicas ≤ 40 (meta 36).
3. Cada tela consome 1-3 endpoints.
4. Zero SQL em `**/*.rotas.ts`.
5. Zero palavra banida em `src/**/*.ts`.
6. 10 clientes API.
7. Pasta `modulos-backend/` removida.
8. Zero `*ComFallback` no frontend.
9. Toda FK com ON DELETE explícito.
10. Colunas JSON ≤ 9, todas justificadas.
11. Build/testes/lint verdes.
12. Visual do frontend idêntico ao baseline.
