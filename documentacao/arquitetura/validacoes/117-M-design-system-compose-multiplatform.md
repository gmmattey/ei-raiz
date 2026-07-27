# 117-M — migração do design system e UI base para Compose Multiplatform

- **Issue:** #194
- **Predecessora obrigatória:** 117-L (fundação KMP, issue #193, PR #204 mergeada)
- **Escopo:** fechar as pendências que a fundação deixou explícitas para esta issue — catálogo
  técnico compartilhado, cobertura de teste comum equivalente ao teste instrumentado de máscara de
  privacidade, e avaliação de preview comum. Nenhuma tela de produto, nenhum redesenho de
  componente.

Este documento registra o que mudou **além** do que a 117-L já entregou. A maior parte da migração
do design system (tokens, tema, componentes em `commonMain`, recursos multiplataforma) já estava
pronta antes desta issue — ver 117-L para o inventário completo.

## O que já vinha pronto da #193 (não foi refeito)

- `SavroTokens.kt`, `SavroTheme.kt`, `SavroComponents.kt` em
  `shared/core/designsystem/src/commonMain/kotlin/io/savro/designsystem/` — tokens, tema e todos os
  componentes (`SavroText`, `SavroSurface`, `SavroCard`, `SavroButton`, `SavroTextField`,
  `SavroFilterChip`, `SavroDivider`, `SavroPrivacyMask`, `SavroStatePanel`) já em `commonMain`, sem
  dependência de `android.*` nem de API exclusiva de plataforma.
- Fontes e strings via `compose.resources` (`composeResources/font`, `composeResources/values`).
- `SavroComponentsPreview.kt` em `androidMain` (ver decisão sobre preview comum abaixo).
- `SavroTokensTest.kt` em `commonTest` (contraste AA + tokens de referência).
- `verifyArchitecture` e `verifyDesignSystemTokens` já cobrindo os três source sets de produção do
  design system.

## 1. Catálogo técnico compartilhado

Não existia módulo ou tela dedicada a catálogo. A raiz `:shared:app` (`SavroApp.kt`) já era
consumida sem alteração por `MainActivity` (Android) e `SavroAppViewController` (iOS) desde a
#193, mas seu conteúdo era uma tela de "evidência técnica" da fundação KMP — cobria a maioria dos
componentes, mas não todas as variantes, e não estava organizada como catálogo.

Formalizado como catálogo técnico do design system, na mesma composable raiz (`SavroCatalog`,
privada, dentro de `SavroApp.kt`), organizado em seções (`CatalogSection`) com título via
`SavroText(style = Title)`. Cobertura ampliada para incluir toda a superfície pública de
`SavroComponents.kt`:

| Seção | Variantes cobertas |
|---|---|
| Tipografia | todos os `SavroTextStyle` (Display, Headline, Title, Body, BodySmall, Label) |
| Superfícies e cards | todos os `SavroCardTone` (Standard, Error, Offline, Hidden) |
| Botões | `SavroButtonStyle` Primary, **Secondary** (não estava na evidência da #193), Destructive, além de desabilitado e carregando |
| Campos de texto | normal e com erro |
| Chips de filtro | selecionado, não selecionado, **desabilitado** (novo) |
| Divisor | `SavroDivider` (não aparecia na evidência da #193) |
| Painéis de estado | todos os `SavroState` (Loading, Empty, Error, Offline, **Hidden**, novo) |
| Máscara de privacidade | oculto/visível |

Não foi criado um módulo novo: o catálogo continua vivendo em `:shared:app`, o único ponto de
entrada compartilhado hoje. Quando telas de produto (Home, patrimônio etc.) existirem, elas
substituem este conteúdo por navegação real — isso é trabalho de issues futuras, fora de escopo
aqui.

**Limitação de ambiente:** o mesmo catálogo é compilado e embarcado para os dois hosts (evidência
de código idêntico), mas rodar e capturar evidência visual em emulador Android e simulador iOS
depende de infraestrutura não disponível neste ambiente (Windows, sem macOS, sem AVD/emulador
provisionado). `assembleDevDebug` e a compilação dos klibs iOS confirmam que o catálogo compila e
resolve para os dois targets — não que renderiza pixel-a-pixel igual, o que exigiria execução real.

## 2. Cobertura de teste comum (equivalente ao teste instrumentado)

`SavroPrivacyMaskInstrumentedTest.kt` (`androidInstrumentedTest`) continua existindo — cobre o
mesmo cenário em ambiente Android real (device/AVD), quando disponível. Além dela, agora existe
`SavroPrivacyMaskCommonTest.kt` em `commonTest`, cobrindo o mesmo estado semântico (conteúdo
sensível some da árvore de semântica quando oculto) e mais um cenário (conteúdo visível quando
`isVisible = true`).

A portabilidade via `runComposeUiTest` (Compose Multiplatform 1.11.1, `org.jetbrains.compose.ui:ui-test`)
exigiu uma ponte de plataforma — `runComposeUiTest`, no target Android, detecta o ambiente
inspecionando `android.os.Build.FINGERPRINT`, que só existe sob um runner Robolectric ativo. Como
`@RunWith` é uma anotação JVM/Android que não compila em `iosTest`, a solução (padrão já usado por
outros projetos KMP com Compose) foi um `expect`/`actual`:

```text
commonTest    → expect abstract class ComposeUiTestBase()
androidUnitTest → actual, anotada @RunWith(RobolectricTestRunner::class) @Config(sdk = [34])
iosTest       → actual vazia (execução real depende de XCTest em host macOS)
```

`SavroPrivacyMaskCommonTest` estende `ComposeUiTestBase()`; o corpo do teste é uma única
implementação em `commonTest`.

Dependências novas: `org.jetbrains.compose.ui:ui-test` (`commonTest`) e `org.robolectric:robolectric:4.16.1`
(`androidUnitTest`, só teste). `android.testOptions.unitTests.isIncludeAndroidResources = true`
ligado no módulo do design system.

**Efeito colateral obrigatório:** `ui-test-manifest` (fornece a activity hospedeira que
`runComposeUiTest` usa por baixo) é `debugImplementation` de propósito — não pode vazar pro
manifest de release. Sem ela, o variant de release não tem como rodar o teste. Em vez de promover a
dependência pra release (o que colocaria uma activity de teste no APK de produção), o unit test de
release do módulo de design system foi desabilitado via
`androidComponents.beforeVariants(selector().withBuildType("release")) { it.enableUnitTest = false }`
— o teste de debug já cobre o mesmo código-fonte comum, então não há perda de cobertura real.

**Evidência executável:**

| Comando | Resultado |
|---|---|
| `:shared:core:designsystem:testDebugUnitTest` | 5 testes (3 `SavroTokensTest` + 2 `SavroPrivacyMaskCommonTest`), 0 falhas — via Robolectric, sem device |
| `:shared:core:designsystem:compileTestKotlinIosArm64` / `IosSimulatorArm64` | BUILD SUCCESSFUL — klibs de teste gerados, comprovando que `ComposeUiTestBase`/`SavroPrivacyMaskCommonTest` não dependem de API Android |

Execução real do teste em simulador iOS (XCTest) depende de host macOS — mesma limitação já
registrada na 117-L para `iosTest`/XCTest em geral.

## 3. Preview comum — avaliado, permanece encapsulado em `androidMain`

Reavaliado nesta issue, não apenas herdado da 117-L: `org.jetbrains.compose.ui.tooling.preview.Preview`
(o `@Preview` multiplataforma do Compose Multiplatform 1.11.1) continua sem suportar parâmetros —
em particular `fontScale`, usado pelas previews de acessibilidade herdadas da #185/#190
(`AccessibleTextPreview`, `fontScale = 1.3f`). Não houve mudança de versão do Compose Multiplatform
nesta issue (permanece 1.11.1) que alterasse essa limitação.

Substituir `fontScale` por alguma outra evidência (por exemplo, compor a UI manualmente escalada)
descartaria a evidência real de como o sistema operacional amplia fonte — perderia o propósito do
teste de acessibilidade. Decisão: manter `SavroComponentsPreview.kt` em `androidMain`, usando o
`@Preview` do AndroidX (via `androidx.compose.ui.tooling.preview`), como diferença de plataforma
documentada — critério de aceite da issue atendido por documentação, não por código comum.

## Verificações executadas

Todas no mesmo ambiente da 117-L: Windows 11 (sem macOS), JDK 17 via toolchain, Gradle 8.13.

| Comando | Resultado |
|---|---|
| `verifyArchitecture verifyDesignSystemTokens` | BUILD SUCCESSFUL |
| `:androidApp:assembleDevDebug` | BUILD SUCCESSFUL |
| `:shared:core:designsystem:testDebugUnitTest` | 5 testes, 0 falhas |
| `:shared:core:testing:testDebugUnitTest` (`VerifyArchitectureFunctionalTest`) | 10 cenários, 0 falhas |
| `:androidApp:testDevDebugUnitTest` | BUILD SUCCESSFUL |
| `:androidApp:lintDevDebug`, `:shared:core:designsystem:lintDebug` | BUILD SUCCESSFUL |
| `:shared:core:designsystem:assembleDebugAndroidTest`, `:androidApp:assembleDevDebugAndroidTest` | BUILD SUCCESSFUL |
| `:shared:app:compileKotlinIosArm64`, `:shared:app:compileKotlinIosSimulatorArm64` | BUILD SUCCESSFUL — klibs gerados |
| `:shared:core:designsystem:compileTestKotlinIosArm64`, `IosSimulatorArm64` | BUILD SUCCESSFUL — klibs de teste gerados |
| `:shared:app:linkDebugFrameworkIosArm64` / `IosSimulatorArm64` | **SKIPPED** — link exige host macOS, igual à 117-L |
| `./gradlew check` (todos os módulos) | BUILD SUCCESSFUL |

## Decisão de infraestrutura de build (fora do escopo funcional, necessária para validar)

Este ambiente não tinha JDK 17 instalado (só JDK 21 via Android Studio) nem `local.properties` com
o SDK Android configurado — a 117-L rodou num ambiente que tinha essas duas coisas prontas.
Adicionado o plugin `org.gradle.toolchains.foojay-resolver-convention` (auto-provisiona o JDK do
toolchain quando não há instalação local compatível) em `settings.gradle.kts`. `local.properties`
não é versionado (já estava no `.gitignore`) — cada máquina configura o seu.

## Critérios de aceite da issue #194 — checklist

- [x] `SavroTheme` e componentes base compilam em Android e iOS — já valia desde a 117-L, reconfirmado.
- [x] O mesmo catálogo visual é exibido em Android e iOS — mesmo código-fonte compilado para os dois
      hosts; execução real em emulador/simulador é limitação de ambiente (documentada), não pendência
      de código.
- [x] Componentes comuns não importam `android.*`, `androidx.activity`, UIKit ou SwiftUI —
      `verifyArchitecture` verde.
- [x] Tokens continuam fonte única — `verifyDesignSystemTokens` verde.
- [x] Diferenças de plataforma documentadas — preview (`androidMain`, item 3) e teste instrumentado
      (`androidInstrumentedTest`, agora com equivalente comum, item 2).
- [x] Testes comuns cobrem estados visuais e semânticos — `SavroPrivacyMaskCommonTest` (commonTest)
      + `SavroTokensTest` (commonTest, já existia).

## Limitações conhecidas (novas ou reafirmadas)

1. Sem macOS neste ambiente — `linkDebugFramework*` continua `SKIPPED`, XCTest real não roda,
   simulador iOS não abre. Mesma limitação da 117-L.
2. Evidência visual do catálogo em emulador Android/simulador iOS não foi capturada — sem
   AVD/simulador provisionados neste ambiente. O código compila e resolve para os dois targets.
3. `runComposeUiTest` na API estável usada (`androidx.compose.ui.test.runComposeUiTest`, não a
   `v2`) está marcada deprecated pelo Compose Multiplatform 1.11.1, recomendando migração futura
   para `androidx.compose.ui.test.v2.runComposeUiTest`. Fora de escopo migrar agora — a v2 muda
   semântica de execução (fila de coroutines em vez de execução imediata) e exigiria revisão dos
   testes existentes.
