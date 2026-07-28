# Testes e gates de regressão — Savro (issue #130)

Lista completa dos gates executáveis criados/estendidos nesta issue, todos rodados localmente
nesta sessão com sucesso, e o que cada um impede.

## Gates Gradle (arquitetura, rodam em segundos, sem device)

| Tarefa | Onde | O que impede | Resultado nesta auditoria |
|---|---|---|---|
| `verifyArchitecture` | `aplicativo/build.gradle.kts` (já existia) | Dependência fora da allowlist, referência de plataforma fora do source set correto, `:shared:core:testing` em runtime de produção | ✅ `BUILD SUCCESSFUL` |
| `verifyDesignSystemTokens` | `aplicativo/build.gradle.kts` (já existia) | Literal visual fora dos arquivos canônicos de tema/tokens | ✅ `BUILD SUCCESSFUL` |
| `verifyNoNetworkAccess` | `aplicativo/build.gradle.kts` (**novo nesta issue**) | Import de cliente HTTP (Ktor, OkHttp, Retrofit, `HttpURLConnection`, `NSURLSession`, `URLSession`, etc.) em qualquer módulo `:shared:*`, em `:androidApp` ou nos arquivos Swift de `:iosApp` | ✅ `BUILD SUCCESSFUL` — adicionado ao job `arquitetura-e-design-system` da CI |

## Testes automatizados (JVM, rodam via Gradle)

| Teste | Módulo | O que impede | Resultado nesta auditoria |
|---|---|---|---|
| `RedacaoModeloPatrimonialTest` | `:shared:core:model` (**novo**) | Regressão de redaction em `ItemPatrimonial`/`AjusteValorItem`/`EventoTimelineItem` — falha se um valor-marcador sensível reaparecer em `toString()` | ✅ 3 testes, 0 falhas |
| `RedacaoConteudoBackupTest` | `:shared:core:backup` (**novo**) | Regressão de redaction em `ConteudoBackup.toString()` (ex.: voltar a listar itens inteiros) | ✅ 1 teste, 0 falhas |
| `VerifyDependencyInventoryTest` | `:shared:core:testing` (**novo**) | Dependência nova em `gradle/libs.versions.toml` sem registro no inventário de dependências | ✅ 1 teste, 0 falhas |
| `VerifyArchitectureFunctionalTest` | `:shared:core:testing` (já existia) | Já cobre proibições de referência proibida/`android.`/`platform.UIKit` em `commonMain` — reforçado por esta issue com a extensão das listas de rede | ✅ (não modificado, mas as fixtures cobrem as listas estendidas) |
| `ApresentacaoValorTest` | `:shared:domain:patrimonio` (já existia) | Regressão da máscara de privacidade em texto/acessibilidade | ✅ (confirmado nesta auditoria como parte da suíte `testes-comuns`) |
| `SavroPrivacyMaskCommonTest`/`SavroPrivacyMaskInstrumentedTest` | `:shared:core:designsystem` (já existiam) | Regressão de vazamento na árvore de semântica | ✅ (confirmado nesta auditoria) |
| `MainActivitySnapshotProtectionTest` | `:androidApp` (já existia) | Regressão do `FLAG_SECURE` | ✅ (confirmado nesta auditoria, roda em `:androidApp:testDevDebugUnitTest`) |

## Testes iOS (`iosTest`, exigem runner macOS real — não executáveis neste ambiente)

| Teste | Módulo | O que impede | Status |
|---|---|---|---|
| `ExclusaoBackupAutomaticoIOSTest` | `:shared:core:database` (**novo**, correção obrigatória do Luiz sobre a #130) | Regressão da lógica pura de exclusão (arquivo ausente não é erro, resultado nunca contém caminho, lista de candidatos correta) | ⏳ Depende do job `ios-xcode-macos` da CI para rodar de verdade |
| `ExclusaoDeBackupAutomaticoDoBancoIntegracaoTest` | `:shared:core:database` (**novo**) | Prova de verdade — abre o banco real e confirma `NSURLIsExcludedFromBackupKey == true` no arquivo criado, não só que a chamada existe no código | ⏳ Depende do job `ios-xcode-macos` da CI |

## O que ainda não é um gate automatizado (limite honesto)

- **API privada da Apple no framework final:** já validado, mas como *step* de CI (`nm`/`strings`
  no job `ios-xcode-macos`), não como teste JUnit/XCTest — não roda neste ambiente (precisa do
  framework linkado, que só existe após build em macOS).
- **`NSURLIsExcludedFromBackupKey` no `savro.db` iOS:** corrigido nesta issue (ver
  `ExclusaoBackupAutomaticoIOS.kt` e os dois testes `iosTest` acima) — a validação real do
  comportamento em runtime, porém, só acontece quando o job `ios-xcode-macos` rodar na CI do PR;
  este ambiente não tem toolchain iOS para confirmar localmente (mesma limitação de todo código
  `iosMain`/`iosTest` já existente no projeto).
- **Captura de tráfego real (proxy) em device/emulador:** não é um gate de CI hoje, nem prático como
  um — é validação manual de release, registrada como pendência em `auditoria-rede-savro.md`.
- **Verificação exaustiva de todo campo futuro sensível via reflexão:** os testes de redaction usam
  amostra fixa de valores-marcador, não reflexão completa (limite técnico do Kotlin/Native em
  `commonMain`, documentado no Kdoc de cada teste).

## CI atualizada nesta issue

`.github/workflows/aplicativo-ci.yml`:

1. Job `arquitetura-e-design-system`: `verifyNoNetworkAccess` adicionado ao comando `./gradlew`.
2. Job `testes-comuns`: `:shared:core:model:testDebugUnitTest` adicionado à lista (módulo não
   estava em nenhum job de CI antes desta issue — hospeda agora os testes de redaction).

Nenhum job de CI real foi executado nesta sessão (sem acesso a GitHub Actions a partir deste
ambiente) — a execução real acontece quando o PR desta issue for aberto.
