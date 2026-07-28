# Inventário de dependências — Savro (issue #130)

Levantado a partir dos arquivos de build reais em 2026-07-28: `aplicativo/gradle/libs.versions.toml`,
todos os `aplicativo/**/build.gradle.kts` (exceto `build/`), e `aplicativo/iosApp/Podfile`. Nenhuma
dependência aqui foi inferida — todas vêm de uma linha real de configuração de build.

**Gate de regressão:** `VerifyDependencyInventoryTest`
(`aplicativo/shared/core/testing/src/androidUnitTest/kotlin/io/savro/testing/VerifyDependencyInventoryTest.kt`)
lê `gradle/libs.versions.toml` e falha se uma chave de `[libraries]` não estiver na lista espelhada
neste documento — ver seção final.

## Confirmação de ausência (critérios de aceite da issue)

Busca em todo `gradle/libs.versions.toml`, `build.gradle.kts` e `Podfile`: **nenhuma** das
categorias abaixo está presente.

| Categoria proibida | Presente? |
|---|---|
| SDK de anúncios (AdMob, Meta Audience Network, etc.) | Não |
| SDK de rastreamento/analytics invasivo (Firebase Analytics, Amplitude, Mixpanel, AppsFlyer, Adjust) | Não |
| SDK de IA em nuvem | Não |
| Crash reporter que capture estado (Crashlytics, Sentry, Bugsnag) | Não |
| Cliente HTTP de qualquer tipo (Ktor, OkHttp, Retrofit, Alamofire, URLSession usado como wrapper de terceiros) | Não |
| Resquício Capacitor/web legado | Não — o legado React/Capacitor vive fora de `aplicativo/`, no restante do monorepo, e não é dependência do módulo Gradle do Savro |

## Bibliotecas Kotlin Multiplatform / comuns

| Chave (`libs.versions.toml`) | Coordenada | Versão | Finalidade | Licença | Targets | Manutenção | Rede | Arquivos | Coleta de dados | Justificativa de permanência |
|---|---|---|---|---|---|---|---|---|---|---|
| `compose-runtime` | `org.jetbrains.compose.runtime:runtime` | 1.11.1 (`composeMultiplatform`) | Runtime do Compose Multiplatform | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Base de UI compartilhada, decisão da ADR-002 |
| `compose-foundation` | `org.jetbrains.compose.foundation:foundation` | 1.11.1 | Primitivas de layout/gesto | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Idem |
| `compose-ui` | `org.jetbrains.compose.ui:ui` | 1.11.1 | Árvore de UI, semantics | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Idem — inclui a árvore de semântica usada por `SavroPrivacyMask` |
| `compose-material3` | `org.jetbrains.compose.material3:material3` | 1.9.0 (`composeMaterial3`) | Componentes Material 3 (cadência própria) | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Só o design system consome direto (ver `forbiddenSharedAppReferences` em `build.gradle.kts`) |
| `compose-material-icons-extended` | `org.jetbrains.compose.material:material-icons-extended` | 1.7.3 | Ícones lineares do design system | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Auditoria #220, checado via `maven-metadata.xml` em 2026-07-27 |
| `compose-components-resources` | `org.jetbrains.compose.components:components-resources` | 1.11.1 | Recursos (fontes, drawables) Compose Multiplatform | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Fontes Manrope/Inter (SIL OFL) |
| `compose-ui-test` | `org.jetbrains.compose.ui:ui-test` | 1.11.1 | Testes de UI comuns (`runComposeUiTest`) | Apache 2.0 | Test only | JetBrains, ativa | Não | Não | Não | Usado por `SavroPrivacyMaskCommonTest` |
| `kotlinx-coroutines-core` | `org.jetbrains.kotlinx:kotlinx-coroutines-core` | 1.11.0 | Corrotinas comuns | Apache 2.0 | Android, iOS | JetBrains, ativa | Não | Não | Não | Base de concorrência de todo o `:shared:*` |
| `kotlinx-coroutines-test` | `org.jetbrains.kotlinx:kotlinx-coroutines-test` | 1.11.0 | Test dispatchers/`runTest` | Apache 2.0 | Test only | JetBrains, ativa | Não | Não | Não | — |
| `kotlinx-coroutines-android` | `org.jetbrains.kotlinx:kotlinx-coroutines-android` | 1.11.0 | Dispatcher `Dispatchers.Main` Android | Apache 2.0 | Android | JetBrains, ativa | Não | Não | Não | — |

## Bibliotecas específicas Android

| Chave | Coordenada | Versão | Finalidade | Licença | Manutenção | Rede | Arquivos | Coleta de dados | Justificativa |
|---|---|---|---|---|---|---|---|---|---|
| `androidx-activity-compose` | `androidx.activity:activity-compose` | 1.12.1 | Integração Activity/Compose | Apache 2.0 | Google, ativa | Não | Não | Não | Host Android padrão |
| `androidx-activity` | `androidx.activity:activity` | 1.12.1 | `ActivityResultContracts` (SAF) | Apache 2.0 | Google, ativa | Não | Sim (acesso ao arquivo escolhido pelo usuário via seletor do sistema, nunca direto) | Não | Backup/restauração/CSV (#121) |
| `androidx-compose-bom` | `androidx.compose:compose-bom` | 2026.06.00 | BOM de versões AndroidX Compose | Apache 2.0 | Google, ativa | Não | Não | Não | Alinha versões `androidx.compose.*` |
| `androidx-compose-ui-tooling` / `-preview` | `androidx.compose.ui:ui-tooling*` | via BOM | Preview/tooling de IDE | Apache 2.0 | Google, ativa | Não | Não | Não | `debugImplementation` apenas, não entra em build de release |
| `androidx-compose-ui-test-junit4` / `-test-manifest` | `androidx.compose.ui:ui-test-*` | via BOM | Testes instrumentados de Compose | Apache 2.0 | Google, ativa | Não | Não | Não | Test only |
| `junit` | `junit:junit` | 4.13.2 | Framework de teste JVM | EPL 1.0 | Ativa | Não | Não | Não | Test only |
| `androidx-junit` | `androidx.test.ext:junit` | 1.3.0 | JUnit para Android | Apache 2.0 | Google, ativa | Não | Não | Não | Test only |
| `androidx-espresso-core` | `androidx.test.espresso:espresso-core` | 3.7.0 | Testes instrumentados de UI | Apache 2.0 | Google, ativa | Não | Não | Não | Test only |
| `robolectric` | `org.robolectric:robolectric` | 4.16.1 | Simula Android em JVM para testes unitários | MIT | Ativa | Não | Não | Não | Test only — permite testar Room/`FLAG_SECURE`/BiometricManager sem device |
| `androidx-room-runtime` / `-ktx` / `-compiler` / `-testing` | `androidx.room:room-*` | 2.8.4 | ORM sobre SQLite/SQLCipher | Apache 2.0 | Google, ativa | Não | Sim (acesso ao arquivo `savro.db`, local) | Não | Baseline aprovado em 117-A (#176), persistência cifrada (#180) |
| `androidx-sqlite` | `androidx.sqlite:sqlite` | 2.6.2 | Contrato SQLite usado pelo Room | Apache 2.0 | Google, ativa | Não | Sim (local) | Não | Dependência do Room |
| `sqlcipher-android` | `net.zetetic:sqlcipher-android` | 4.17.0 | SQLite com criptografia AES-256 em repouso | BSD-style (Zetetic) | Zetetic, ativa | Não | Sim (local, é o próprio motor do banco) | Não | Núcleo da persistência cifrada (117-A/#180) — validado quanto a compatibilidade de página de 16 KB do Android 15+ como parte do spike da #180 |
| `androidx-biometric` | `androidx.biometric:biometric` | 1.1.0 | `BiometricPrompt` | Apache 2.0 | Google, ativa | Não | Não | Não (não acessa dados biométricos brutos — API delega tudo ao sistema) | Cofre local (#118) |
| `bouncycastle-provider` | `org.bouncycastle:bcprov-jdk18on` | 1.85 | PBKDF2-HMAC-SHA256 leve (`PKCS5S2ParametersGenerator`), sem `Security.addProvider` global | MIT | Legion of the Bouncy Castle, ativa (madura desde 2000, release de julho/2026 checado nesta auditoria via `maven-metadata.xml`) | Não | Não | Não | Backup (#121, PR #228) — necessário porque `SecretKeyFactory` do Android só tem `PBKDF2WithHmacSHA256` a partir da API 26 e o app suporta `minSdk = 23` |

## Bibliotecas específicas iOS

| Dependência | Onde é declarada | Versão | Finalidade | Licença | Manutenção | Rede | Arquivos | Coleta de dados | Justificativa |
|---|---|---|---|---|---|---|---|---|---|
| CommonCrypto | API pública do sistema (iOS), sem gerenciador de pacote | Sistema (iOS 15+ mínimo do Podfile) | AES-256-CTR + HMAC-SHA256 do backup, PBKDF2-HMAC-SHA256 | N/A (parte do SO) | Apple | Não | Não | Não | Única primitiva de cripto do backup no iOS — **só API pública** (`CCCryptorCreateWithMode(kCCModeCTR, ...)`, `CCHmac`), nunca o modo GCM privado (`kCCModeGCM`/`CommonCryptorSPI.h`) — decisão revertida no PR #228 por não ser aceitável usar SPI privada da Apple mesmo funcionando em runtime |
| Security.framework (Keychain) | API pública do sistema, `platform.Security` (Kotlin/Native) | Sistema | Guarda a chave mestra do cofre (`kSecClassGenericPassword`) | N/A | Apple | Não | Não | Não | `ProvedorChaveMestraIOS` |
| LocalAuthentication (`LAContext`) | API pública do sistema | Sistema | Face ID/Touch ID/código do dispositivo | N/A | Apple | Não | Não | Não | `AutenticadorBiometricoIOS` |
| SQLCipher (pod CocoaPods) | `iosApp/Podfile` | `~> 4.9.0` | SQLite com criptografia AES-256 — mesma família de biblioteca do lado Android, versão de pod correspondente | BSD-style (Zetetic) | Zetetic, ativa | Não | Sim (local) | Não | Persistência cifrada iOS (#180) — resolvido só para o build Gradle/KMP (cinterop); o `iosApp.xcodeproj` depende do Podfile para o link final do executável (ver comentário no `Podfile`, achado real de CI, não hipotético) |
| UIDocumentPickerViewController, UniformTypeIdentifiers | API pública do sistema | Sistema | Seletor nativo de arquivo (backup/CSV) | N/A | Apple | Não | Sim (arquivo escolhido pelo usuário) | Não | `ArquivosDoSistemaIOS` |

**Nota sobre o Podfile:** o gate automatizado desta issue (`VerifyDependencyInventoryTest`) só
inspeciona `gradle/libs.versions.toml` — **não** cobre o `Podfile` automaticamente. A versão do
CocoaPods está fixada manualmente neste documento e no `Podfile`; qualquer mudança de versão do pod
`SQLCipher` precisa atualizar as duas fontes manualmente. Registrado como limite honesto do gate,
não como lacuna escondida.

## Plugins de build (não são dependências de runtime, mas afetam o binário final)

| Chave | Coordenada | Versão | Finalidade |
|---|---|---|---|
| `android-application` / `android-library` | `com.android.application` / `com.android.library` (AGP) | 8.13.2 | Plugin de build Android |
| `kotlin-android` / `kotlin-multiplatform` / `kotlin-compose` | Kotlin Gradle Plugin | 2.3.10 | Compilação Kotlin/KMP/Compose |
| `compose-multiplatform` | `org.jetbrains.compose` | 1.11.1 | Plugin do Compose Multiplatform |
| `ksp` | `com.google.devtools.ksp` | 2.3.10 | Processador de anotações do Room | 
| `kotlin-cocoapods` | `org.jetbrains.kotlin.native.cocoapods` | 2.3.10 | Integração CocoaPods (só usada por `:shared:core:database` para o pod SQLCipher) |

## Gate de regressão

`VerifyDependencyInventoryTest.BIBLIOTECAS_REGISTRADAS`
(`aplicativo/shared/core/testing/src/androidUnitTest/kotlin/io/savro/testing/VerifyDependencyInventoryTest.kt`)
espelha exatamente as 28 chaves de `[libraries]` documentadas acima. Rodado localmente nesta
auditoria: **1 teste, 0 falhas**. Adicionar uma dependência nova sem atualizar essa lista e este
documento quebra o teste — é o mecanismo que impede "dependência nova sem registro no inventário"
(critério de aceite da issue).
