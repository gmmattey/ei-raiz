# iosApp — host Xcode do Savro

Projeto Xcode do host iOS. Fica **fora do grafo Gradle** (ADR-002) e consome o framework
`SavroApp`, produzido pelo módulo KMP `:shared:app`.

## Como abrir e rodar (exige macOS + Xcode)

```bash
open aplicativo/iosApp/iosApp.xcodeproj
```

O target `iosApp` roda, antes de compilar Swift, a build phase "Compilar e embarcar framework KMP",
que executa `./gradlew :shared:app:embedAndSignAppleFrameworkForXcode` na raiz do projeto Gradle
(`aplicativo/`). Não é preciso rodar Gradle manualmente antes.

Para gerar o framework fora do Xcode:

```bash
cd aplicativo
./gradlew :shared:app:linkDebugFrameworkIosSimulatorArm64
```

## Identidade

| Configuração | Bundle identifier |
|---|---|
| Debug | `io.savro.app.dev` |
| Release | `io.savro.app` |

`Configuration/Config.xcconfig` guarda `APP_NAME`, `BUNDLE_ID` e `TEAM_ID`. O `TEAM_ID` fica vazio
no repositório — preencher localmente ou via CI de assinatura. Nenhum certificado, perfil de
provisionamento ou credencial da App Store Connect é versionado aqui.

## Limitação conhecida

`linkDebugFramework*` e qualquer build do Xcode exigem host macOS. Em Windows/Linux o Gradle
compila os `.klib` de `iosArm64`/`iosSimulatorArm64` normalmente, mas pula as tarefas de link
(`SKIPPED`). O job de CI em runner macOS é responsabilidade da #195.
