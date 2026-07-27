# ADR-002 — Savro Kotlin Multiplatform + Compose Multiplatform (Android e iOS)

- **Status:** proposta aprovada pelo solicitante; efetiva após merge. A implementação (#193–#195,
  #179–#182, #180) permanece pendente e bloqueada até esta ADR ser mergeada.
- **Data:** 2026-07-27.
- **Relacionada:** #116, #123. **Sucede:** ADR-001 (`ADR-001-savro-android-local-first.md`),
  gerada pela #174. **Predecessora obrigatória de:** #193, #194, #195, #179–#182, #180.
- **Escopo:** decisão arquitetural e plano de migração para Kotlin Multiplatform + Compose
  Multiplatform. Não cria projeto Xcode, módulo Gradle, keystore, recurso Cloudflare, segredo,
  pipeline executável, deploy ou operação de dados. Não implementa telas, fluxos, componentes ou
  comportamento visual — isso pertence às issues funcionais (#118–#130) e às tasks #193–#195.

## Decisão

Savro passa a ser um aplicativo **Android e iOS**, os dois como runtimes de primeira classe,
sobre uma base compartilhada em **Kotlin Multiplatform (KMP) + Compose Multiplatform**. O banco
local cifrado continua sendo a fonte de verdade do usuário, em cada dispositivo. Cloudflare
continua distribuindo somente dados públicos e impessoais. Nenhuma posição, quantidade, saldo,
instituição, aporte, histórico, diagnóstico pessoal ou backup sai do aparelho — em nenhuma das
duas plataformas.

Esta ADR substitui, na ADR-001, apenas a premissa "Android é o único runtime". Tudo o mais que a
ADR-001 decidiu sobre local-first, ausência de conta, matriz de dados, contrato público
Android↔Worker e separação entre cofre do usuário e assinatura do aplicativo continua vigente e é
estendido a iOS sem enfraquecimento.

## Identidade técnica

| Elemento | Decisão |
|---|---|
| Produto (nome definitivo) | **Savro** |
| Identidade histórica / nome do repositório durante a transição | `esquilo-wallet` — "Esquilo Wallet" é identidade histórica, não nome comercial vigente |
| Organização responsável | 7A Labs — não aparece como design system nem identidade visual dentro do app |
| Projeto Gradle raiz | `savro-android` (renomear quando #193 criar a estrutura KMP; ver seção de migração) |
| Namespace Kotlin | `io.savro.app` |
| Android applicationId produção | `io.savro.app` |
| Android applicationId desenvolvimento | `io.savro.app.dev` |
| iOS bundle identifier produção | `io.savro.app` |
| iOS bundle identifier desenvolvimento | `io.savro.app.dev` |
| Deep link | `savro://` |
| Banco local | `savro.db` |
| Backup exportado | `*.savrobackup` |
| Alias Keystore (Android) | `savro.vault.master.v1` |

Os quatro identificadores (Android prod/dev, iOS prod/dev) ficam confirmados como identidade
técnica alvo. **Pendências que continuam bloqueando publicação, não a arquitetura:** disponibilidade
e configuração desses identificadores nas lojas (Play Console e App Store Connect), assets finais
de marca, domínio HTTPS definitivo, Android App Links e iOS Universal Links, e o cadastro formal
nas duas lojas. A #193 pode usar os identificadores acima na fundação local (Gradle, Info.plist),
mas não cria app na App Store Connect nem publica nada.

## Módulos e source sets

Arquitetura modular desde a fundação — nem monólito `:shared` único, nem fragmentação prematura em
módulos de banco/rede/segurança/feature antes de haver implementação real:

```text
:shared:core:common          — commonMain/androidMain/iosMain + commonTest
:shared:core:model           — commonMain (+ commonTest)
:shared:core:testing         — fixtures, fakes e utilitários de teste (commonMain/commonTest)
:shared:domain:patrimonio    — commonMain (+ commonTest)
:shared:core:designsystem    — commonMain/androidMain/iosMain (Compose Multiplatform) + commonTest
:shared:app                  — commonMain/androidMain/iosMain — estados de apresentação, composição
                                compartilhada, navegação comum
:androidApp                  — módulo Android puro (com.android.application)
:iosApp                      — projeto Xcode separado (fora do grafo Gradle), consome o framework
                                KMP publicado por :shared:app
```

```text
androidApp → shared:app → shared:domain:patrimonio → shared:core:model / shared:core:common
iosApp     → shared:app (via framework KMP)
shared:app → shared:core:designsystem
shared:domain:patrimonio não depende de shared:app, Compose, Room, SQLCipher, Keystore, Keychain
  ou qualquer API de plataforma
shared:core:designsystem não depende de shared:domain:patrimonio
```

### Responsabilidades

| Módulo | Responsabilidade | Não conhece |
|---|---|---|
| `:shared:core:common` | Primitivas puras — `Result`, erros, relógio, identificadores, dispatchers, utilitários realmente compartilháveis | Android, iOS, UI, banco, rede |
| `:shared:core:model` | Modelos canônicos (item patrimonial, movimento, diagnóstico, etc.) | Banco, rede, Android, iOS, UI |
| `:shared:core:testing` | Fixtures, fakes e utilitários exclusivos de teste | Runtime de produção (mesma regra que `:core:testing` já tinha na ADR-001) |
| `:shared:domain:patrimonio` | Regras financeiras, casos de uso, contratos de repositório (interfaces) | Room, SQLCipher, Keystore, Keychain, Compose, HTTP concreto |
| `:shared:core:designsystem` | Tokens, tema e componentes Compose Multiplatform | Regras patrimoniais, rede, persistência |
| `:shared:app` | Estados de apresentação, composição compartilhada, navegação comum, integração entre features | Keystore, Keychain, Room, SQLCipher ou qualquer API específica de plataforma |
| `:androidApp` | Activity, lifecycle Android, permissões, Android Keystore, `BiometricPrompt`, notificações, arquivos (SAF), publicação Play Store | Regra de negócio própria (consome `:shared`) |
| `:iosApp` | Host Swift/Xcode, lifecycle iOS, Keychain, `LocalAuthentication`, notificações, arquivos, publicação App Store | Regra de negócio própria (consome o framework `:shared`) |

**Não criados nesta issue** (registrados aqui como pontos futuros de extração, não implementados):
`shared:core:database` (contrato + implementação de persistência), `shared:core:security`
(contrato de cofre), `shared:core:network` (cliente HTTP comum e validação de manifesto), e os
módulos `feature:*` (onboarding, home, patrimônio, ativo, histórico, importação, diagnósticos,
simulações, ajustes). Esses módulos nascem quando a issue correspondente (#180 para persistência,
#118 para cofre, #124/#125 para rede/mercado, #119/#120/etc. para features) começar a implementar —
`:shared:app` e `:shared:domain:patrimonio` hospedam as interfaces/contratos até lá; a extração para
módulo próprio é reorganização de baixo risco quando o volume de código justificar.

## Matriz comum × Android × iOS

| Área | commonMain (`:shared:*`) | Android (`:androidApp`) | iOS (`:iosApp`) |
|---|---|---|---|
| UI/Design system | Tema, tokens, componentes Compose Multiplatform, estados de tela | Host Activity; proteção de screenshot/Recents | Host SwiftUI/UIKit; proteção de snapshot no app switcher |
| Domínio/regras financeiras | 100% — casos de uso, cálculos, validações | — | — |
| Modelos e contratos de repositório | 100% — interfaces e DTOs | — | — |
| Persistência física | Schema lógico comum, migrations versionadas, contrato de repositório | Implementação concreta (decisão pendente da #180) | Implementação concreta (decisão pendente da #180) |
| Criptografia de chave mestra | Contrato (`selar`/`abrir`/`invalidar`) | Android Keystore (alias `savro.vault.master.v1`, não exportável) + AES-GCM | Keychain + Secure Enclave quando aplicável |
| Biometria | Contrato de autenticação local | `BiometricPrompt` | `LocalAuthentication` (Face ID/Touch ID/código) |
| Arquivos (backup/export) | Formato `*.savrobackup`, serialização, validação de integridade | Storage Access Framework / MediaStore | `UIDocumentPickerViewController` |
| Notificações | Regras de geração, priorização, deduplicação, conteúdo redigido | `NotificationManagerCompat` + canais | `UNUserNotificationCenter` + categorias |
| Tarefas em segundo plano | Regras de agendamento (intervalo mínimo, o que roda, o que é oportunista) | `WorkManager` | `BGAppRefreshTask`/`BGProcessingTask` — sem prometer periodicidade exata |
| Rede | Cliente comum, validação de manifesto/hash de pacote público | Engine Ktor OkHttp | Engine Ktor Darwin |
| Testes | `commonTest` — regras, cálculos, máquina de estados do cofre | `androidUnitTest`/`androidInstrumentedTest` — Keystore, BiometricPrompt, WorkManager | `iosTest` (XCTest via KMP) — Keychain, LocalAuthentication, BGTaskScheduler |
| Publicação | — | Play Console, Play App Signing, AAB | App Store Connect, TestFlight, assinatura Apple |

## Persistência cifrada multiplataforma

Esta ADR define **contrato**, não biblioteca. A escolha de biblioteca concreta fica com a #180
(ver "Pendência deliberada" abaixo).

Decisão arquitetural obrigatória:

- `commonMain` define schema lógico (entidades, tipos, versão) e contratos de repositório por
  agregado como interfaces (`RepositorioItens`, `RepositorioMovimentos`, ...).
- Migrations são versionadas e testáveis a partir de `commonMain` (o *o que muda* entre versões de
  schema é comum; *como* a migration é executada fisicamente pode diferir por engine).
- Criptografia em repouso é obrigatória nas duas plataformas — sem exceção, sem modo "não cifrado"
  temporário.
- Implementações físicas de banco e de criptografia podem diferir entre Android e iOS.
- **Compartilhar código nunca reduz a proteção do cofre** — se uma biblioteca comum não sustentar
  criptografia equivalente numa das plataformas, a plataforma mais fraca não vira o teto para as
  duas; a decisão correta nesse caso é usar implementações nativas distintas atrás do mesmo
  contrato, não baixar o padrão de segurança da plataforma mais forte.
- Nenhum tipo de banco (entidade Room, `Cursor`, tipo de driver SQLDelight, etc.) atravessa a
  fronteira de `:shared:domain:patrimonio` ou `:shared:app` — essas camadas só conhecem os
  contratos de repositório e os modelos de `:shared:core:model`.

### Pendência deliberada — biblioteca de persistência (responsabilidade da #180)

A escolha de SQLDelight, Room KMP, ou combinação de persistência nativa por plataforma **não é
decidida nesta ADR**. A #180 deve abrir com um spike comparativo obrigatório entre, no mínimo:

- Room KMP;
- SQLDelight;
- combinação de persistência nativa por plataforma (ex.: Room/SQLCipher no Android + solução
  nativa iOS).

Critérios do spike: criptografia real e mantida; suporte a migrations; suporte Android e iOS;
**compatibilidade com páginas de 16 KB no Android** (requisito de compatibilidade de página de
memória introduzido pelo Android 15+/dispositivos recentes); integração com Keystore e Keychain;
suporte a backup e restauração; maturidade/manutenção da biblioteca; licença; impacto no tamanho do
binário; testabilidade multiplataforma (o quanto dá para cobrir via `commonTest` com fakes vs. o
que exige teste de plataforma). Este registro formaliza a lacuna como decisão pendente da #180, não
como indecisão desta arquitetura.

## Estratégia para Keystore, Keychain e LocalAuthentication

- `:shared:domain:patrimonio` (ou um contrato equivalente hospedado ali até `core:security` ser
  extraído) define a máquina de estados do cofre, já enumerada pela issue #118: descriptografando,
  desbloqueado, credencial inválida, biometria indisponível, bloqueio temporário, chave invalidada,
  restauração necessária, erro recuperável. Essa máquina de estados é 100% comum e testável em
  `commonTest` sem tocar em Keystore/Keychain reais.
- `:androidApp` implementa com Android Keystore (chave não exportável, alias
  `savro.vault.master.v1`) + `BiometricPrompt`.
- `:iosApp` implementa com Keychain (acesso restrito ao dispositivo desbloqueado) + Secure Enclave
  quando disponível + `LocalAuthentication` (`LAContext`) para Face ID/Touch ID/código do
  dispositivo.
- Invalidação de chave (mudança de biometria, restauração em outro aparelho, remoção do app):
  regra de negócio idêntica nas duas plataformas — bloquear o cofre, nunca recuperar via servidor,
  nunca apagar o banco silenciosamente; o evento de sistema que dispara isso é plataforma-específico
  (`KeyPermanentlyInvalidatedException` no Android vs. erro correspondente do Keychain/LAContext no
  iOS) e é mapeado para o mesmo estado comum.
- Nenhuma das duas implementações nativas é testável por `commonTest` — seguem cobertas por
  `androidInstrumentedTest` e testes iOS (XCTest via KMP) próprios.

## Fronteiras entre UI comum e UI específica

- Toda tela de produto nasce em Compose Multiplatform dentro de `:shared:app`/
  `:shared:core:designsystem`, consumindo os mesmos estados de apresentação — já era regra
  explícita da issue #118 ("A UI e o estado principal do fluxo devem ser compartilhados em Compose
  Multiplatform quando compatíveis").
- UI específica de plataforma só onde a plataforma exigir de verdade: seletor de arquivo nativo,
  prompt de biometria nativo, share sheet, deep link no nível do SO, splash screen nativa. Esses
  pontos ficam atrás de uma interface comum (ex. `SeletorDeArquivo`, `PromptBiometrico`)
  implementada em cada plataforma e chamada a partir da UI comum — a tela não sabe qual plataforma
  está rodando.
- `:shared:app` e `:shared:domain:patrimonio` nunca importam `android.*`, `androidx.compose.material3`
  diretamente sem passar pelo wrapper do design system comum, `UIKit` ou `SwiftUI`. Onde uma
  diferença de recursos for inevitável (ex.: `res/font`/`res/raw` Android vs. bundle de recursos
  iOS para as mesmas fontes Manrope/Inter), a diferença é documentada como decisão explícita do
  design system, não como exceção silenciosa.

## Arquivos, notificações e tarefas em segundo plano

| Necessidade | commonMain | Android | iOS |
|---|---|---|---|
| Backup/CSV (#121) | Formato, serialização, validação de integridade e versão | SAF (`ACTION_CREATE_DOCUMENT`/`ACTION_OPEN_DOCUMENT`) | `UIDocumentPickerViewController` |
| Alertas locais (#128) | Regras: o que notificar, prioridade, deduplicação, conteúdo sempre redigido (nunca valor real) | `NotificationManagerCompat` + canais | `UNUserNotificationCenter` + categorias |
| Atualização de pacotes públicos (#125) | Regra: intervalo mínimo, o que roda, o que é "oportunista" | `WorkManager` (`PeriodicWorkRequest` com constraints) | `BGAppRefreshTask`/`BGProcessingTask` |

A UI deve comunicar o comportamento real: atualização em segundo plano é oportunista, nunca
requisito para abrir o app; iOS não garante execução pontual de background tasks e o produto não
pode prometer isso na cópia nem depender disso na lógica — já registrado nas issues #125/#128.

## Fontes visuais — autoridade e como serão consumidas pelas próximas issues

Esta ADR **não implementa** telas, fluxos, componentes ou comportamento visual. Registra apenas a
ordem de autoridade que as próximas issues (#118–#122, #194) devem seguir ao consumir referência
visual, e o estado da sincronização encontrado nesta auditoria.

**Ordem de autoridade (da mais para a menos canônica):**

1. Versão atual publicada no projeto de design (`claude.ai/design`) indicado pelo Luiz;
2. Protótipo mobile atual disponível online;
3. Design system atual disponível online;
4. ZIPs locais (`Esquilo Wallet Design System.zip`, `Novo Esquilo.zip`) — somente como fallback,
   referência offline e evidência histórica;
5. Documentação do repositório (`SAVRO_PROTOTIPOS.md`, `SAVRO_DESIGN_SYSTEM.md`);
6. Código existente (`:core:designsystem` atual).

**Divergência registrada nesta auditoria (2026-07-27):** os dois ZIPs em
`C:\Users\luizg\Downloads\` estão desatualizados em relação aos projetos online equivalentes:

| Arquivo local | SHA-256 | Divergência frente à versão online |
|---|---|---|
| `Novo Esquilo.zip` | `3c4249bc51fbce2374e07392e948561169da1ea7c3793fc9cba10f434d1e7f41` | Falta `Esquilo - MVP1.dc.html` (existe online, projeto `445b937c-...`), faltam `assets/illus-onb-{1,2,3}.svg`, `assets/illus-home-empty.svg`, `screenshots/check{1,2,3}.png` e uploads mais recentes |
| `Esquilo Wallet Design System.zip` | `0827d4ac27579cf43ddbc7ce13c2c4b3fdb935c71fde49878b7d483f6203cfc3` | Falta `splash-concept-cofre.html`, faltam variantes não-white dos SVGs de marca (`savro-icone.svg`, `savro-logo-completo.svg`, `savro-marca.svg` — o ZIP só tinha as versões `-white`) e uploads mais recentes |

Nenhum documento do repositório registrava hash desses ZIPs antes desta auditoria — não há
"antes/depois" byte a byte, só a comparação contra o conteúdo online atual (via `DesignSync`,
`list_files`) feita nesta auditoria. **A versão online é tratada como canônica**; a ausência do
`Esquilo - MVP1.dc.html` no ZIP local é divergência de sincronização, não indício de que o arquivo
tenha sido removido do produto — `SAVRO_PROTOTIPOS.md` continua correto ao tratá-lo como artefato
ativo do MVP1.

**Templates completos encontrados no design system online** (`templates/cadastro-manual`,
`templates/detalhe-item`, `templates/home`, `templates/lista-patrimonial`) são registrados aqui
como **referência futura para #119 e #120** — não são implementados nesta ADR nem nesta issue.

## Cloudflare, contrato público e GitHub Actions

Sem mudança em relação à ADR-001: Worker distribui somente dados públicos e impessoais
(`/v1/health`, `/v1/manifest`, `/v1/packages/market/*`, `/v1/catalog/*`, `/v1/indices`,
`/internal/ingestion/market`); Android e iOS nunca acessam D1, endpoint administrativo ou serviço
de backup diretamente; ambientes de desenvolvimento e produção devem usar recursos Cloudflare
fisicamente separados (dívida crítica do D1 compartilhado atual continua registrada e não
resolvida por esta ADR). Workflows futuros (`android-ci.yml` ampliado, novo job iOS,
`cloudflare-ci.yml`, `cloudflare-deploy.yml`, `market-ingestion.yml`) seguem o desenho da ADR-001,
com a adição de um job de build iOS em runner macOS na #195.

## Estratégia de migração das entregas #176–#185, #189 e #190

`#189` e `#190` são **pull requests já mergeados na `master`** (commits `88f3c17` e `0bdbf00`),
não issues pendentes:

- **#189** — modularização Android e verificações arquiteturais: `android/build.gradle.kts`
  (tasks `verifyArchitecture`/`verifyDesignSystemTokens`), `settings.gradle.kts`, allowlist de
  dependências por módulo, `VerifyArchitectureFunctionalTest.kt`, doc `117-C`.
- **#190** — fundação Compose do design system Android: `core:designsystem` completo (`SavroTheme`,
  `SavroTokens`, `SavroComponents`, previews, testes de contraste/instrumentado), fontes
  Manrope/Inter, evidências AVD, doc `117-J`.

| Tratamento | Componentes |
|---|---|
| **Adaptar para módulos KMP** | A lógica de `verifyArchitecture`/`verifyDesignSystemTokens` (#189) — reescrita para o modelo de source sets KMP (`commonMain` não importa `android.*`/`UIKit`/`SwiftUI`), mesma allowlist de dependências adaptada aos novos módulos `:shared:*`. Tokens, tema e componentes de `core:designsystem` (#190) — migram para `:shared:core:designsystem` (Compose Multiplatform), preservando decisões de contraste AA (`#3A5FE0` sobre branco) e ausência deliberada de tema claro |
| **Reutilizável sem alteração** | Identidade técnica (`io.savro.app`, `savro.vault.master.v1`, `*.savrobackup`), decisões de licença/origem das fontes (SIL OFL, hashes já documentados em 117-J), critérios de avaliação de biblioteca já aplicados em #176 (manutenção, compatibilidade, tamanho, licença) — reaproveitáveis como template de avaliação para o spike de persistência da #180 |
| **Substituir** | Estrutura de módulo `com.android.library` de `core:common`, `core:model`, `core:designsystem`, `domain:patrimonio` — recriados como módulos KMP (`org.jetbrains.kotlin.multiplatform`) em vez de migrados incrementalmente; testes instrumentados Android (`connectedAndroidTest`) precisam de equivalente `commonTest`/`iosTest` onde a regra testada for comum |
| **Específico do Android, continua assim** | `BiometricPrompt`, Android Keystore, `WorkManager`, recursos `res/font`/`res/raw`, `AndroidManifest.xml`, todo o conteúdo hoje em `:androidApp` |

`core:model`, `core:common` e `domain:patrimonio` existem hoje só como módulos Gradle vazios
(`build.gradle.kts` sem `src/` populado) — não há regra de negócio real para migrar ainda; a
"migração" desses três é, na prática, recriação direta como módulos KMP.

## Segurança e telemetria

Sem mudança de princípio em relação à ADR-001 e à issue #130: nenhum dado patrimonial em
logs/telemetria/crashes em nenhuma das duas plataformas; nenhum SDK entra só por funcionar no
Android — compatibilidade, coleta e comportamento no iOS também precisam ser avaliados antes de
adicionar qualquer dependência nova, comum ou nativa.

## Riscos e decisões pendentes

1. Biblioteca de persistência multiplataforma — spike obrigatório da #180 (seção acima).
2. Disponibilidade e configuração de `io.savro.app` nas duas lojas antes de qualquer publicação.
3. Formato/senha de recuperação e transferência direta de `*.savrobackup` entre plataformas —
   responsabilidade da #121, não alterada por esta ADR.
4. Telemetria, redaction e modelo de ameaças multiplataforma — responsabilidade da #130.
5. D1 compartilhado dev/prod/preview do Worker público — dívida crítica que continua sem correção
   registrada nesta ADR.
6. Assets finais de marca, domínio HTTPS, App Links/Universal Links e cadastro nas lojas — pendentes
   de decisão de produto/marca, não de arquitetura.

## Adendo — ADR-001

A ADR-001 permanece no repositório, não é apagada, e recebe status de **sucedida/histórica** por
esta ADR-002 (ver atualização de cabeçalho no próprio arquivo). Continuam válidos da ADR-001:
local-first; funcionamento sem conta; dados patrimoniais fora da nuvem; backend restrito a dados
públicos; separação entre chave do cofre do usuário e chave de assinatura do aplicativo; transição
controlada do sistema legado (React/Capacitor + API atual permanecem isolados, sem ampliação
funcional, até substituição). Deixam de ser canônicas as decisões Android-only da ADR-001
(módulos Gradle exclusivamente Android, "Android é o único runtime").

## Critérios de aceite da #192

- [x] A nova ADR declara formalmente que Android e iOS são runtimes suportados.
- [x] A ADR-001 fica marcada como histórica/sucedida, sem ser apagada.
- [x] As fronteiras comuns e específicas por plataforma estão verificáveis (seção de módulos e
      matriz comum × Android × iOS).
- [x] Segurança e persistência não são tratadas como automaticamente compartilháveis (contrato
      comum + implementação nativa distinta, pendência deliberada de biblioteca na #180).
- [x] Não há contradição entre a nova ADR e as issues abertas (ver documento de validação 117-K).
- [x] A implementação da persistência (#180) fica bloqueada até esta decisão ser aprovada.
