# 117-L — fundação Kotlin Multiplatform (Android + iOS)

- **Issue:** #193
- **Predecessora obrigatória:** ADR-002 (`ADR-002-savro-kmp-multiplataforma.md`)
- **Sucede na prática:** 117-C (allowlist arquitetural) e 117-J (design system Compose)
- **Escopo:** estrutura de módulos KMP, hosts Android/iOS e adaptação das verificações executáveis.
  Nenhuma funcionalidade de produto, nenhum módulo de banco/segurança/rede.

Este documento registra **apenas as decisões que a implementação obrigou a tomar**. Nada aqui
altera ou reabre a ADR-002.

## Estrutura entregue

```text
aplicativo/
├── settings.gradle.kts            rootProject.name = "savro"
├── build.gradle.kts               verifyArchitecture + verifyDesignSystemTokens + check
├── gradle/libs.versions.toml
├── androidApp/                    com.android.application (io.savro.app)
├── iosApp/                        projeto Xcode, fora do grafo Gradle
└── shared/
    ├── app/                       :shared:app        — KMP + Compose Multiplatform + framework iOS
    ├── core/
    │   ├── common/                :shared:core:common
    │   ├── model/                 :shared:core:model
    │   ├── testing/               :shared:core:testing
    │   └── designsystem/          :shared:core:designsystem — KMP + Compose Multiplatform
    └── domain/
        └── patrimonio/            :shared:domain:patrimonio
```

## Decisões tomadas por necessidade de implementação

### 1. Diretório `android/` renomeado para `aplicativo/`; projeto Gradle `savro-android` → `savro`

O diretório passou a hospedar `iosApp/`; manter o nome `android` seria falso. A ADR-002 já previa a
renomeação do projeto Gradle raiz nesta issue. Documentação histórica (ADR-001, 117-A) **não foi
reescrita** — continua citando `android/`, que é o caminho correto para a época em que foi escrita.

O workflow `.github/workflows/android-ci.yml` virou `aplicativo-ci.yml` ("Aplicativo CI" /
"Validar aplicativo KMP"). Se houver required status check configurado com o nome antigo no GitHub,
ele precisa ser reapontado.

### 2. Alvos iOS: `iosArm64` e `iosSimulatorArm64`; **sem `iosX64`**

`iosX64` só serve a simulador em Mac Intel. Não há Mac Intel no time; incluí-lo dobraria a matriz de
compilação e de CI sem consumidor. Reverter é trivial (uma linha por módulo) caso apareça a
necessidade.

### 3. Compose Multiplatform 1.11.1 com Kotlin 2.3.10 e AGP 8.13.2 — sem downgrade

Nenhuma versão foi rebaixada. A combinação compila Android e os klibs de iOS. Dois ajustes foram
obrigatórios:

- **Dependências Compose declaradas explicitamente.** Os atalhos `compose.runtime`,
  `compose.foundation`, `compose.ui`, `compose.material3` e `compose.components.resources` estão
  marcados como deprecados em nível de erro na 1.11.1 ("Specify dependency directly"). As
  coordenadas foram para `libs.versions.toml`.
- **Material 3 do Compose Multiplatform tem cadência de versão própria.** O estável mais recente é
  `org.jetbrains.compose.material3:material3:1.9.0`, enquanto runtime/foundation/ui/resources estão
  em `1.11.1`. Por isso existem duas versões no catálogo (`composeMultiplatform` e
  `composeMaterial3`).
- `platform(...)` deixou de ser aceito dentro do DSL de source set do KMP no Kotlin 2.3. O BOM
  androidx (usado só por ferramentas de preview/teste do target Android) foi movido para o bloco
  `dependencies { }` de projeto.

### 4. Recursos multiplataforma: `compose.resources`

Fontes e strings passaram de `res/font` e `res/values` para `composeResources/`:

| Antes (Android) | Agora (KMP) |
|---|---|
| `core/designsystem/src/main/res/font/*.ttf` | `shared/core/designsystem/src/commonMain/composeResources/font/*.ttf` |
| `core/designsystem/src/main/res/raw/*_ofl.txt` (licenças SIL OFL) | `shared/core/designsystem/src/commonMain/composeResources/files/*_ofl.txt` |
| `app/src/main/res/values/strings.xml` | `shared/app/src/commonMain/composeResources/values/strings.xml` |

Os arquivos de fonte são binariamente os mesmos de #190 — licença e hashes documentados em 117-J
continuam válidos.

Consequência de API: `org.jetbrains.compose.resources.Font` é `@Composable`, então
`SavroTypography` (um `val` de nível superior) virou `savroTypography(): Typography`, função
composable interna. Os valores de tipografia não mudaram.

### 5. `SavroText` adicionado ao design system

A ADR-002 proíbe `:shared:app` de importar `androidx.compose.material3` diretamente. A tela de
evidência precisava de texto, e nenhum componente do design system expunha isso. Foi adicionado
`SavroText` + `SavroTextStyle` em `:shared:core:designsystem/commonMain`, mapeando para
`MaterialTheme.typography` sem literal visual. Além disso, `compose.material3` é declarado como
`implementation` (não `api`) no design system, o que faz a fronteira valer também em tempo de
compilação, não só na verificação estática.

### 6. Previews continuam em `androidMain`

`org.jetbrains.compose.ui.tooling.preview.Preview` (multiplataforma) não aceita parâmetros, e as
previews de #190 dependem de `@Preview(fontScale = 1.3f)` como evidência de acessibilidade.
`SavroComponentsPreview.kt` foi para `shared/core/designsystem/src/androidMain/` mantendo o
`androidx` `@Preview`. Avaliar preview comum é pendência da #194. **Reavaliado na #194 (117-M):
permanece em `androidMain`** — a limitação de parâmetros não mudou na versão do Compose
Multiplatform em uso.

### 7. `VerifyArchitectureFunctionalTest` vive em `androidUnitTest`

O teste usa Gradle TestKit, que é JVM. Com `:shared:core:testing` virando módulo KMP, o único source
set JVM disponível é `androidUnitTest`. Efeito colateral: esse source set compila contra o
`android.jar`, que não expõe `Files.writeString` — as escritas passaram a usar `File.writeText`.
A propriedade de sistema `savro.android.root` virou `savro.projeto.raiz`.

### 8. Source sets vazios não recebem `.gitkeep`

`:shared:core:common`, `:shared:core:model` e `:shared:domain:patrimonio` continuam sem fontes
(igual a 117-C: estrutura arquitetural, sem entrega funcional). Os source sets são declarados nos
`build.gradle.kts` e materializados pelo Gradle; nenhum arquivo marcador foi adicionado ao
repositório.

## Verificações adaptadas ao modelo de source sets

`verifyArchitecture` passou a inspecionar `src/{commonMain,androidMain,iosMain}/kotlin` de cada
módulo `:shared:*`, com regras diferentes por source set:

| Escopo | Regra |
|---|---|
| `commonMain` (qualquer módulo compartilhado) | sem `android.*`, sem androidx específico de plataforma (`activity`, `core`, `lifecycle`, `room`, `sqlite`, `work`, `biometric`, `ui.tooling.preview`, `ui.res`), sem `platform.UIKit`/`Foundation`/`darwin`/`LocalAuthentication`/`Security`, sem `kotlinx.cinterop`, sem SQLCipher/`java.sql` |
| `iosMain` | sem `android.*` e sem androidx de plataforma |
| `androidMain` | sem API Apple (`platform.*`, `kotlinx.cinterop`) |
| Módulos puros (`core:common`, `core:model`, `core:testing`, `domain:patrimonio`), qualquer source set | sem `androidx.` inteiro, sem Compose, banco, rede ou serialização |
| `:shared:app`, qualquer source set | sem `androidx.compose.material3.` e `androidx.compose.material.` — só através do design system |

`androidx.compose.*` não pode ser proibido em bloco no `commonMain` porque o Compose Multiplatform
reaproveita esse mesmo pacote; por isso a lista é enumerada.

Allowlist de dependências de projeto:

```text
:androidApp                → :shared:app
:shared:app                → :shared:core:common, :shared:core:model,
                             :shared:core:designsystem, :shared:domain:patrimonio
:shared:core:designsystem  → :shared:core:common
:shared:domain:patrimonio  → :shared:core:common, :shared:core:model
:shared:core:common        → (nenhuma)
:shared:core:model         → (nenhuma)
:shared:core:testing       → (nenhuma; e nunca em configuração de produção)
```

`verifyDesignSystemTokens` mantém a mesma lista de literais proibidos, agora varrendo os três source
sets de produção do design system. Arquivos canônicos:
`commonMain/.../tema/SavroTokens.kt`, `commonMain/.../tema/SavroTheme.kt` e
`androidMain/.../componentes/SavroComponentsPreview.kt`.

`VerifyArchitectureFunctionalTest` passou de 7 para 10 cenários TestKit — os três novos cobrem
vazamento de `platform.UIKit` em `commonMain`, uso direto de Material 3 em `:shared:app` e
referência Android em `iosMain`.

## Host iOS

`:iosApp` é projeto Xcode (SwiftUI, `iosApp.xcodeproj`) fora do grafo Gradle, como a ADR-002 define.
Integração escolhida: **`binaries.framework` estático + `embedAndSignAppleFrameworkForXcode`**, sem
CocoaPods e sem XCFramework — nenhuma ferramenta extra, nenhum arquivo gerado versionado. O framework
se chama `SavroApp` e expõe `SavroAppViewController()`.

Bundle identifier: Debug → `io.savro.app.dev`, Release → `io.savro.app`, espelhando o
`applicationIdSuffix` do Android. `Configuration/Config.xcconfig` tem `TEAM_ID` vazio: nenhum
certificado, perfil ou credencial de App Store Connect é versionado.

## Evidência de validação

Executado em Windows 11 (sem macOS), JDK 17 (toolchain), Gradle 8.13:

| Comando | Resultado |
|---|---|
| `verifyArchitecture verifyDesignSystemTokens` | BUILD SUCCESSFUL |
| `:androidApp:assembleDevDebug` | BUILD SUCCESSFUL |
| `:shared:core:designsystem:testDebugUnitTest` | 3 testes, 0 falhas (contraste AA + tokens) |
| `:androidApp:testDevDebugUnitTest` | BUILD SUCCESSFUL |
| `:shared:core:testing:testDebugUnitTest` | 10 testes TestKit, 0 falhas |
| `:androidApp:lintDevDebug :shared:core:designsystem:lintDebug` | BUILD SUCCESSFUL |
| `:shared:core:designsystem:assembleDebugAndroidTest`, `:androidApp:assembleDevDebugAndroidTest` | BUILD SUCCESSFUL |
| `:shared:app:compileKotlinIosArm64`, `:shared:app:compileKotlinIosSimulatorArm64` | BUILD SUCCESSFUL — klibs gerados |
| `:shared:app:linkDebugFrameworkIosArm64` / `IosSimulatorArm64` | **SKIPPED** — link exige host macOS |

A compilação dos klibs de iOS é a evidência executável de que `commonMain` e `iosMain` não dependem
de API Android: o compilador Kotlin/Native rejeitaria qualquer referência a `android.*`.

## Limitações conhecidas

1. **Sem macOS neste ambiente.** `linkDebugFramework*` fica `SKIPPED` e o projeto Xcode nunca foi
   aberto nem compilado. O `project.pbxproj` foi escrito à mão e ainda não teve validação por
   Xcode real. Primeira execução em Mac (ou o job de CI macOS da #195) deve confirmá-lo.
2. **Testes iOS (`iosTest`/XCTest via KMP) não existem ainda** — dependem de host macOS.
3. **Teste instrumentado Android compila mas não roda aqui** (sem dispositivo/AVD). A cobertura
   comum equivalente via `runComposeUiTest` é pendência da #194. **Fechada na #194 (117-M):**
   `SavroPrivacyMaskCommonTest` em `commonTest`, rodando via Robolectric no target Android sem
   device. O teste instrumentado original continua existindo para validação em ambiente Android
   real.
4. **`:shared:core:testing` sem fixtures comuns.** Continua servindo só à verificação arquitetural,
   como em 117-C.
