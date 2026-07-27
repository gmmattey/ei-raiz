# ADR-001 — Savro Android local-first

> **Histórica/sucedida em 2026-07-27** — a decisão "Android como único runtime" foi substituída pela
> issue `#192` (Kotlin Multiplatform + Compose Multiplatform, Android **e** iOS como runtimes de
> primeira classe). Ver adendo no final deste arquivo. O que continua válido desta ADR: local-first,
> sem conta, dados patrimoniais fora da nuvem, backend só com dados públicos. O que não vale mais:
> "Android é o único runtime" e qualquer detalhe específico de módulo Gradle Android-only.

- **Status:** proposta aprovada pelo solicitante; efetiva após merge e conclusão da #174. A implementação permanece pendente.
- **Data:** 2026-07-26
- **Relacionada:** #116; **predecessora obrigatória de:** #117.
- **Escopo:** decisão arquitetural e plano de migração. Não cria aplicativo, recurso Cloudflare, segredo, pipeline executável, keystore, deploy ou operação de dados.

## Decisão

Savro será um aplicativo Android nativo, local-first e sem conta. O Android é o único runtime de dados patrimoniais. O cofre local é a fonte de verdade; Cloudflare distribui somente dados públicos e impessoais. Nenhuma posição, quantidade, saldo, instituição, aporte, histórico, diagnóstico pessoal ou backup sai do aparelho.

O sistema React/Capacitor e a API patrimonial atuais permanecem isolados e operantes apenas durante a transição. Não podem receber ampliação funcional, exceto correção crítica. A futura transformação do web em página institucional e a remoção do sistema anterior pertencem às features de migração, não a esta ADR.

## Identidade técnica

| Elemento | Decisão |
|---|---|
| Produto | Savro |
| Repositório durante a transição | `esquilo-wallet` |
| Projeto Gradle | `savro-android` |
| Namespace Kotlin | `io.savro.app` |
| Application ID de produção | `io.savro.app` |
| Application ID de desenvolvimento | `io.savro.app.dev` |
| Deep link provisório | `savro://` |
| Banco local | `savro.db` |
| Backup exportado | `*.savrobackup` |
| Alias Keystore | `savro.vault.master.v1` |

Antes da publicação na Play Store devem ser validados definitivamente a disponibilidade do `applicationId`, o domínio HTTPS, os Android App Links e a relação de marca entre Savro, Esquilo Wallet e 7ALabs. Esta validação não bloqueia a definição arquitetural, mas bloqueia a publicação.

## Módulos e dependências

```text
android/
├── app
├── core/
│   ├── common
│   ├── model
│   ├── database
│   ├── security
│   ├── network
│   ├── designsystem
│   └── testing
├── domain/
│   ├── patrimonio
│   ├── mercado
│   ├── diagnosticos
│   ├── simulacoes
│   └── backup
└── feature/
    ├── onboarding
    ├── home
    ├── patrimonio
    ├── ativo
    ├── historico
    ├── importacao
    ├── diagnosticos
    ├── simulacoes
    └── ajustes

app → feature → domain → core:model / core:common
feature → core:designsystem
core:database / core:network / core:security → core:model / core:common
```

`app` compõe navegação raiz, DI e variantes. `feature:*` contém estado e UI por jornada, sem SQL ou cliente HTTP direto. `domain:*` contém regras e casos de uso determinísticos, sem UI, Room, SQLCipher, Android framework, HTTP ou Cloudflare. `core:database` contém Room, DAOs, entidades e migrations; entidades Room não atravessam sua fronteira. `core:security` contém Keystore, biometria, sessão do cofre e criptografia. `core:network` baixa e valida somente pacotes públicos. `core:testing` fornece fakes, fixtures e utilitários de teste.

Dependências entre features são proibidas; navegação entre elas é composta em `app`. Módulos core não dependem de features. Não criar micro-módulos adicionais sem evidência de necessidade.

## Matriz de dados e fluxos

| Classe | Exemplos | Armazenamento/processamento | Pode sair do aparelho? |
|---|---|---|---|
| Patrimonial privado | itens, movimentos, quantidades, instituições, saldos, perfil, diagnósticos, simulações, `historico_patrimonial_mensal` | cofre local cifrado | Não |
| Público impessoal | catálogos, cotações, índices, fontes, licenças, versão e frescor | pacote público local e Worker/D1 público | Sim, somente como conteúdo público |
| Backup privado | arquivo `*.savrobackup` cifrado | escolha explícita do usuário | Somente exportação/transferência consciente, nunca para serviço Savro |
| Técnico permitido | versão do app, versão de schema, erro redigido e estado técnico agregado | conforme política futura da #130 | Apenas se não permitir inferir patrimônio |
| Proibido na nuvem/logs/telemetria | lista de ativos, tickers consultados individualmente, valores, instituições, descrições, arquivos, identificadores patrimoniais e contexto de IA | não coletar | Nunca |

```text
Android ──GET público──> Worker público ──> D1 público
Android <──manifesto/pacote_mercado── Worker público
GitHub Actions ──dados públicos normalizados──> endpoint interno do Worker

Android -X-> D1
Android -X-> endpoint administrativo
Android -X-> serviço Savro de backup
Worker  -X-> banco patrimonial
```

O aplicativo baixa `pacote_mercado` por manifesto ou versão, não consulta ticker individual conforme a carteira. Antes de promover pacote ao cache ativo, valida `schemaVersion`, `packageVersion`, tamanho, hash SHA-256, compatibilidade, fonte, licença, `generatedAt` e `validUntil`. Uma falha mantém o último pacote íntegro utilizável offline. `snapshot` pode descrever conceito externo ou histórico, mas não nomeia tabela, módulo ou entidade canônica.

## Cofre local, banco e backup

Room é a abstração de persistência. O banco `savro.db` será integralmente cifrado por SQLCipher for Android integrado ao Room, com schema versionado e migrations incrementais testadas. SQLCipher é dependência externa condicionada a validação prévia de manutenção, compatibilidade, tamanho do aplicativo e licença na #117. Impedimento material comprovado exige nova decisão arquitetural; não autoriza migração silenciosa para criptografia parcial.

1. Na instalação, gerar passphrase aleatória de 256 bits.
2. Proteger a passphrase por chave não exportável do Android Keystore, alias `savro.vault.master.v1`.
3. Usar AES-GCM para proteger materiais criptográficos e arquivos exportados.
4. Nunca armazenar passphrase, chave, PIN ou dado patrimonial em texto puro; PIN nunca é chave criptográfica direta.
5. Usar `BiometricPrompt` e credencial segura do dispositivo conforme a configuração escolhida pelo usuário na #118.
6. Em telas protegidas, impedir captura de tela e exposição do conteúdo no seletor de apps recentes; a política fina de telas e transições é detalhada na #118.
7. DAOs e entidades ficam internos a `core:database`; alterações patrimoniais exigem integridade transacional.

Se a chave Keystore for invalidada, o aplicativo bloqueia o cofre, não tenta recuperação em servidor e não apaga o banco. Explica a causa e permite apenas restaurar um `*.savrobackup` válido, com confirmação explícita antes de substituir dados locais. Sem backup exportado, informa que os dados não são recuperáveis. A remoção do app, restauração em outro dispositivo e alteração de biometria/credencial seguem a mesma regra: nenhuma recuperação implícita e nenhuma corrupção silenciosa.

O backup exportado possui criptografia própria, independente da chave do aparelho, para permitir restauração em outro dispositivo. Seu desenho de senha/chave de recuperação, formato e transferência direta é responsabilidade da #121; esta ADR fixa apenas a independência criptográfica e a ausência de custódia pelo Savro.

Banco, chaves, preferências sensíveis e arquivos temporários devem ser excluídos do Android Auto Backup por regras explícitas de data extraction. `android:allowBackup` só pode permanecer habilitado se essas regras excluírem integralmente tais dados em todas as versões Android suportadas; sem essa garantia, deve ser desabilitado. Backup patrimonial ocorre exclusivamente pelo fluxo criptografado e consciente da #121.

## Contrato público Android ↔ Worker

O Worker público pode servir manifesto, `pacote_mercado`, catálogos, índices, health check e metadados de fonte/frescor; não autentica usuário final nem executa diagnóstico personalizado.

| Método | Rota | Responsabilidade |
|---|---|---|
| GET | `/v1/health` | saúde sem dados de usuário |
| GET | `/v1/manifest` | versões e referências de pacotes públicos |
| GET | `/v1/packages/market/latest` | última versão íntegra de `pacote_mercado` |
| GET | `/v1/packages/market/:version` | versão específica de pacote público |
| GET | `/v1/catalog/assets` | catálogo público quando necessário |
| GET | `/v1/catalog/funds` | catálogo público de fundos |
| GET | `/v1/indices` | índices públicos |
| POST | `/internal/ingestion/market` | ingestão administrativa autenticada, exclusiva do pipeline |

Cada pacote inclui `schemaVersion`, `packageVersion`, `generatedAt`, `validUntil`, `sources`, `licenses`, `sha256` e payload ou referência de download. Esses nomes em camelCase são permitidos como contrato externo. O Android não acessa D1, endpoint administrativo, fontes financeiras externas ou serviço de backup Savro.

## Cloudflare e ambientes

| Recurso | Desenvolvimento | Produção | Responsabilidade |
|---|---|---|---|
| Worker | `savro-public-api-dev` | `savro-public-api` | distribuição pública e ingestão interna |
| D1 | `savro-public-data-dev` | `savro-public-data-prod` | dados públicos normalizados |
| Pages | preview por branch | `savro-web` | presença institucional futura |
| API | `workers.dev` de desenvolvimento | `api.savro.*` após domínio aprovado | acesso público controlado |

Desenvolvimento e produção devem usar D1s fisicamente distintos, com `database_id` distintos, tokens distintos e GitHub Environments distintos. O Worker atual usa o mesmo `database_id` em desenvolvimento, preview e produção; isto é dívida crítica e item obrigatório da migração. Esta ADR não cria nem altera recursos Cloudflare.

## GitHub Actions, permissões e segredos

| Workflow futuro | Gatilho inicial | Permissões mínimas | Responsabilidade | Não faz |
|---|---|---|---|---|
| `android-ci.yml` | PR com `android/**`, manual | `contents: read` | lint, testes unitários/arquitetura, assembleDebug, artefatos | assinatura ou Play Console |
| `android-release.yml` | somente manual | `contents: read`; secrets apenas em `production` | validar versão/tag, suíte completa, AAB assinado, checksums | publicar automaticamente |
| `cloudflare-ci.yml` | PR de Worker/contratos/migrations/ingestão públicos | `contents: read` | typecheck, testes, schemas, migrations e bloqueio de contratos privados | deploy |
| `cloudflare-deploy.yml` | definido na migração | `contents: read`; token do environment alvo | preview/dev separado de produção protegido | migration destrutiva automática |
| `market-ingestion.yml` | manual e agendado quando disponível | `contents: read`; token de ingestão do environment alvo | coleta pública, normalização, validação e lote idempotente | invalidar último pacote íntegro em falha |

| Environment | Segredos previstos |
|---|---|
| `development` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN_DEV`, `SAVRO_INGESTION_TOKEN_DEV` |
| `production` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN_PROD`, `SAVRO_INGESTION_TOKEN_PROD`, `ANDROID_UPLOAD_KEYSTORE_B64`, `ANDROID_UPLOAD_KEYSTORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON` |

Ambientes e segredos ainda não existem e não são criados nesta issue. Todos os workflows negam permissões não listadas; em PR não há acesso a secrets de environment nem de produção. O environment `production` exige aprovação de revisores antes de usar segredos para release ou deploy. Tokens são separados por ambiente e de menor privilégio; segredos não aparecem em logs e material temporário é apagado inclusive em falha. A rotação é registrada fora do Git e é obrigatória em expiração, suspeita de comprometimento ou mudança de acesso, com substituição independente por ambiente e revogação do token anterior.

A chave do cofre é local e não exportável pelo Android Keystore. A upload key é exclusiva do pipeline e materializada apenas de forma efêmera. Play App Signing guarda a chave final de assinatura. Tokens Cloudflare e de ingestão autenticam infraestrutura. Esses quatro conjuntos de credenciais não se compartilham.

## Estratégia de migração

| Tratamento | Componentes |
|---|---|
| Reutilizar | regras financeiras canônicas, documentação funcional aprovada, fontes públicas úteis, políticas de frescor e identidade visual vigente |
| Substituir | wrapper Capacitor, autenticação/sessão remota, D1 patrimonial, API patrimonial, dashboard web autenticado e React como runtime Android |
| Manter temporariamente | web e Worker atuais, deploy existente e pipelines atuais, isolados sem ampliação patrimonial |
| Encerrar depois da migração | `com.esquiloinvest.app` se `io.savro.app` for publicado, módulo Capacitor, endpoints de conta/patrimônio, D1 remoto com dados pessoais após plano próprio de exportação/descarte e deploy web autenticado |

Nenhuma remoção, migration remota, descarte de dados ou interrupção do sistema existente é autorizada por esta ADR. A #117 deve consumir esta arquitetura para criar o Android nativo; ela já está formalmente bloqueada por #174 no GitHub.

## Riscos e decisões pendentes

1. Antes da #117, validar SQLCipher quanto a manutenção, compatibilidade, tamanho e licença.
2. Antes da publicação, validar domínio HTTPS, App Links e disponibilidade final de `io.savro.app`.
3. Antes da #121, definir segredo/chave de recuperação, formato, retenção e transferência de `*.savrobackup` sem custódia remota.
4. Antes da #130, formalizar política de telemetria, redaction de crashes, inventário de SDKs e modelo de ameaças.
5. Antes do deploy da migração, provisionar recursos Cloudflare e Environments separados, com permissões mínimas e sem compartilhar D1.
6. A API/telemetria atuais processam dados associados a usuário e não atendem à arquitetura alvo; devem ser isoladas até substituição, nunca ampliadas.

## Adendo — 2026-07-27

Luiz reconfirmou a decisão local-first como real (não hipótese de protótipo) ao aprovar a
sincronização dos protótipos de tela Savro (`documentacao/produto/SAVRO_PROTOTIPOS.md`,
projeto claude.ai/design `445b937c-6ecb-433d-a2b2-6886bc919204`). Escopo de entrega definido
para este momento: **somente o MVP1** (`Esquilo - MVP1.dc.html`) — 7 etapas, sem cotações
automáticas, sem conta, backup/restauração local. O fluxo mobile estendido e a landing "em breve"
ficam como referência de roadmap, não como escopo de implementação atual. Este adendo não altera
nenhuma decisão técnica desta ADR; apenas registra a reconfirmação e o corte de escopo de entrega.

## Adendo — 2026-07-27 (2) — correção arquitetural: KMP, Android + iOS

Leitura das issues do GitHub (`gmmattey/esquilo-wallet`) mostrou que a decisão "Android é o único
runtime" desta ADR **já foi superada dentro do próprio projeto antes deste adendo**, pela issue
`#192` ("Redefinir arquitetura do Savro para Kotlin Multiplatform"), aberta a partir da issue-pai
`#116` ("Transformar o Savro em um aplicativo mobile local-first, multiplataforma e sem conta").
`#174` (que gerou esta ADR-001) está fechada com o título "sucedida pela `#192`".

**O que muda:**
- Savro passa a ser **Android e iOS**, os dois como runtimes de primeira classe — não só Android.
- Base técnica: **Kotlin Multiplatform (KMP) + Compose Multiplatform**. `commonMain` concentra
  modelos, regras financeiras, casos de uso, estados de apresentação, contratos de repositório,
  processamento de pacotes públicos e formato de backup. `androidMain` cuida de Android Keystore,
  BiometricPrompt e integrações Android; `iosMain` cuida de Keychain/Secure Enclave,
  LocalAuthentication e integrações Apple.
- Persistência cifrada usa contrato comum, com implementação nativa possivelmente distinta por
  plataforma — compartilhar código nunca reduz a proteção do cofre (regra explícita da `#192`).
- Backup precisa restaurar de Android para iOS e vice-versa (critério de aceite da `#121`).

**O que continua igual** (não foi alterado pela correção): local-first, sem conta, dados
patrimoniais nunca saem do aparelho, backend só distribui dados públicos/impessoais, `esquilo-wallet`
continua sendo o repositório durante a transição.

**Status real no momento deste adendo:** a `#192` está **aberta**, ou seja, a nova ADR canônica
multiplataforma ainda não foi escrita/aprovada formalmente — a decisão está proposta e detalhada na
issue, não em um documento `ADR-002` neste repositório. A `#192` bloqueia a implementação de
persistência (`#180`) até ser aprovada. A fundação Android já construída pelas issues `#176`–`#185`,
`#189` e `#190` (todas fechadas — Gradle, módulos, design system Compose) foi feita sob a ADR-001
Android-only e pode precisar de ajuste quando a fundação KMP (`#193`–`#195`) for criada.

Este segundo adendo é só registro de leitura das issues — não cria a ADR-002. Quando a `#192` for
aprovada e fechada, criar `ADR-002-savro-kmp-multiplataforma.md` (ou nome equivalente) como a nova
ADR canônica, marcando esta ADR-001 como histórica de forma definitiva.

## Critérios de aceite da #174

- [x] Nome de trabalho, namespace, IDs e recursos documentados.
- [x] Validação final do `applicationId` marcada como bloqueadora de publicação.
- [x] Módulos e dependências permitidas definidos.
- [x] Domínio independente de UI, banco e rede.
- [x] Cofre separado da assinatura do aplicativo.
- [x] Ciclo de vida e invalidação de chaves documentados.
- [x] Dados sensíveis excluídos do Auto Backup por política obrigatória.
- [x] Recursos Cloudflare de desenvolvimento e produção separados na arquitetura.
- [x] D1 compartilhado atual registrado como dívida crítica.
- [x] Contratos públicos não permitem envio de patrimônio.
- [x] Android baixa pacotes públicos sem revelar carteira.
- [x] CI, release, deploy e ingestão possuem responsabilidades distintas.
- [x] Segredos e aprovações por environment definidos arquiteturalmente.
- [x] Migração do Capacitor preserva o sistema atual até substituição.
- [x] Relação bloqueadora entre #174 e #117 registrada.
- [x] Nenhuma implementação, operação destrutiva, recurso, segredo, workflow executável ou deploy foi realizado.
