# 117-N — CI multiplataforma (Android/iOS) e job real em runner macOS

- **Issue:** #195
- **Predecessoras obrigatórias:** #193 (fundação KMP, 117-L) e #194 (design system compartilhado, 117-M)
- **Escopo:** evoluir `.github/workflows/aplicativo-ci.yml` (criado em #183, adaptado em #193) para
  separar checks, ampliar cobertura de `commonMain`/`iosMain` e acrescentar um job real em runner
  macOS hospedado pela GitHub. Nenhuma mudança de funcionalidade de produto.
- **Recorte pedido pelo Luiz:** validar o máximo possível em runner Linux e só usar `macos-*` para o
  que exige link de framework real e integração Gradle ↔ Xcode de verdade — não é "macOS local"
  (a máquina de desenvolvimento é Windows); é o runner macOS hospedado do próprio GitHub Actions.

## O que mudou

O job único `aplicativo` virou cinco jobs independentes, cada um falhando isoladamente:

| Job | Runner | O que valida |
|---|---|---|
| `arquitetura-e-design-system` | ubuntu-latest | `verifyArchitecture` + `verifyDesignSystemTokens` |
| `testes-comuns` | ubuntu-latest | `commonTest` (via `testDebugUnitTest`) de `:shared:core:testing`, `:shared:core:designsystem` e `:androidApp` |
| `android-build` | ubuntu-latest | lint (`:androidApp`, `:shared:core:designsystem`) + `assembleDevDebug` |
| `ios-compilacao-linux` | ubuntu-latest | `compileKotlinIosArm64` + `compileKotlinIosSimulatorArm64` (klib, sem link) |
| `ios-xcode-macos` | **macos-14** | `linkDebugFrameworkIosSimulatorArm64` + `xcodebuild build` do `iosApp.xcodeproj` (simulador, sem assinatura) |

Motivo da separação: um job monolítico esconde qual verificação quebrou atrás de "BUILD SUCCESSFUL"
parcial no log; jobs distintos aparecem como checks separados no PR.

## Por que existe um job macOS (e por que ele é justificado aqui)

`linkDebugFramework*` e qualquer build do `iosApp.xcodeproj` exigem o toolchain Apple (`ld64`,
Xcode) — o Kotlin/Native compila klibs em Linux, mas **pula** (`SKIPPED`) a etapa de link de
framework fora de host Apple. Isso já estava documentado como limitação conhecida em 117-L (item 1)
desde a fundação KMP em #193.

A issue #195 exige explicitamente:

- "O projeto iOS compila em simulador no runner macOS" (critério de aceite).
- "Validar integração Gradle ↔ Xcode sem exigir assinatura ou certificado em pull request" (escopo).

Não dá pra satisfazer isso em runner Linux — não é uma limitação de configuração, é o toolchain de
link/Xcode não existir fora de macOS. Por isso o job `ios-xcode-macos` roda em `macos-14`
(runner hospedado pela GitHub, não a máquina do Luiz). É a primeira vez que o `iosApp.xcodeproj`
(escrito à mão em #193, nunca aberto em Xcode real) é efetivamente compilado.

## Como o job macOS evita assinatura/certificado

```bash
xcodebuild -project iosApp/iosApp.xcodeproj -scheme iosApp \
  -sdk iphonesimulator -destination "generic/platform=iOS Simulator" \
  -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

`CODE_SIGNING_ALLOWED=NO` desliga assinatura por completo — build de simulador não precisa de
certificado nem perfil de provisionamento, e `Configuration/Config.xcconfig` já mantém `TEAM_ID`
vazio no repositório. Nenhum secret é usado; nenhum artefato (`.app`, `.ipa`, `.xcarchive`) é
publicado ou enviado a lugar nenhum fora do runner efêmero.

A build phase "Compilar e embarcar framework KMP" do target `iosApp` roda
`./gradlew :shared:app:embedAndSignAppleFrameworkForXcode` de novo durante o `xcodebuild`,
confirmando a integração Gradle ↔ Xcode de ponta a ponta. Um passo anterior já roda
`linkDebugFrameworkIosSimulatorArm64` isolado, para que uma quebra de link apareça num step
específico em vez de dentro do log da build phase do Xcode.

## Controle de custo/duração do runner macOS

- O workflow inteiro só dispara em `pull_request` com `paths: aplicativo/**` — nunca em outros
  diretórios do monorepo, nunca em push direto para `master`.
- `concurrency` com `cancel-in-progress: true` cancela a execução (incluindo o job macOS) assim que
  um novo commit chega no mesmo PR — evita empilhar runners caros em PRs com muitos commits.
- `timeout-minutes: 30` no job `ios-xcode-macos` evita runner preso cobrando indefinidamente.
- O job não roda em `workflow_dispatch` manual repetido sem necessidade — só nos mesmos gatilhos dos
  demais jobs.
- Runners macOS da GitHub custam um múltiplo do runner Linux (histórico ~10x); o path filter em
  `aplicativo/**` já é o controle principal, porque qualquer PR que toque `commonMain`/`iosMain`
  precisa mesmo validar o lado iOS — não dá pra restringir mais sem violar o critério "PR que altera
  código comum valida Android e iOS".

## O que esta CI NÃO valida (documentado, não fingido)

- **Build de Release, `.xcarchive` ou `.ipa`** — fora de escopo da issue, exige assinatura real.
- **Certificado, perfil de provisionamento ou credencial da App Store Connect** — não existe secret
  nenhum configurado neste workflow, de propósito.
- **Execução real do app ou de testes de UI em simulador booted** — o job faz `build`, não `test`
  nem `run`. Não há simulador iniciado, não há XCTest executado. O `TestAction` do scheme
  `iosApp.xcscheme` está vazio (sem `Testables`) — não existe suíte XCTest hoje.
- **TestFlight ou publicação na App Store** — fora de escopo desta issue por definição (ver "Fora de
  escopo" na #195).
- **iosTest (XCTest via KMP)** — ainda não existe no projeto (limitação já registrada em 117-L,
  item 2); quando existir, entra neste mesmo job macOS.

## Consequência sobre 117-L

Isso resolve, na prática, o item 1 das limitações conhecidas de 117-L ("sem macOS neste ambiente,
`project.pbxproj` nunca foi aberto nem compilado") — mas só **depois que o Actions rodar de fato**
no GitHub. Este agente não tem acesso a macOS para validar localmente; a validação real acontece no
runner hospedado após o push do PR desta issue.

## Primeira execução real no runner macOS — falha e correção

A primeira execução real do job `ios-xcode-macos` (commit `fba09c56`) falhou no step "Linkar
framework KMP (SavroApp, simulador)" — não por scheme, SDK ou dependência ausente, e sim por
`OutOfMemoryError: Java heap space` durante `linkDebugFrameworkIosSimulatorArm64`:

```
The currently configured max heap space is '1 GiB'.
e: Compilation failed: Java heap space
e: java.lang.OutOfMemoryError: Java heap space
    at org.jetbrains.kotlin.backend.konan.llvm.DeclarationsGeneratorVisitor.createClassDeclarations(...)
```

Causa raiz: `aplicativo/gradle.properties` fixava `org.gradle.jvmargs=-Xmx1024m`. Esse teto nunca
tinha sido testado contra o link real de framework Kotlin/Native (a IR completa do `shared:app` com
Compose Multiplatform embutido) porque, até este PR, `linkDebugFrameworkIosSimulatorArm64` sempre
rodou `SKIPPED` fora de host Apple (ver 117-L) — os jobs Linux (`ios-compilacao-linux`) só compilam
klib, sem o passo de link que estoura heap. 1 GiB é suficiente para lint, testes e `assembleDevDebug`
Android, mas não para o link de framework KMP com o grafo de IR desse tamanho.

Correção: `org.gradle.jvmargs` elevado para `-Xmx6144m` em `aplicativo/gradle.properties`. Runner
`macos-14` da GitHub tem 14 GB de RAM disponíveis; runners `ubuntu-latest` usados pelos outros quatro
jobs continuam confortáveis com o teto mais alto porque já concluíam com folga em 1 GiB — elevar o
teto não força uso de mais memória onde não é preciso, só permite que o link do framework não
estoure. Efeito colateral aceito: build local (Windows) e todos os jobs de CI agora podem alocar até
6 GB de heap Java quando a tarefa exigir.

Com o link corrigido, a segunda execução real (commit `51057ad`) avançou e revelou uma segunda falha,
agora no step "Build do iosApp para simulador (sem assinatura)":

```
> Task :shared:app:syncComposeResourcesForIos FAILED
error: Unknown iOS simulator arch: 'x86_64'
```

Causa raiz: `-destination "generic/platform=iOS Simulator"` faz o `xcodebuild` compilar para o
`ARCHS_STANDARD` padrão do SDK `iphonesimulator`, que é universal (`arm64 x86_64`), na ausência de
qualquer `EXCLUDED_ARCHS`/`ARCHS` customizado no projeto. O módulo KMP (`shared/app/build.gradle.kts`)
só declara `iosArm64()` e `iosSimulatorArm64()` — nunca existiu `iosX64()` (simulador Intel) neste
projeto — então a task de sincronização de recursos do Compose Multiplatform, ao rodar durante a
build phase do Xcode, recebe `$ARCHS` incluindo `x86_64` e não encontra target KMP correspondente.

Correção: adicionado `"EXCLUDED_ARCHS[sdk=iphonesimulator*]" = x86_64;` nas configurações de build
`Debug` e `Release` do nível de projeto em `iosApp.xcodeproj/project.pbxproj`. Isso apenas declara,
de forma permanente no projeto Xcode (não só via flag de linha de comando da CI), que o app não
suporta simulador Intel — coerente com o que o módulo KMP já expunha. Não afeta build de dispositivo
real (`iphoneos`, arquitetura `arm64` única) nem qualquer critério de aceite da #195.

Primeira tentativa dessa correção (commit `6b4a721`) escreveu a chave **sem aspas**
(`EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64;`) e quebrou o parser OpenStep do `project.pbxproj`
inteiro: `xcodebuild: error: ... The project 'iosApp' is damaged and cannot be opened due to a parse
error.` — chave de build setting condicional (com `[`, `]`, `=`, `*`) precisa estar entre aspas nesse
formato de plist; sem aspas, o parser tenta tokenizar cada caractere especial como se fosse
sintaxe do arquivo. Corrigido citando a chave inteira.
