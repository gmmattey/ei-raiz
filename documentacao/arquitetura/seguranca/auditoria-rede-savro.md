# Auditoria de rede — Savro (issue #130)

**O que foi de fato feito nesta auditoria:** leitura estática de código, grep estruturado, leitura
de manifests/entitlements/plist, e um gate Gradle novo executado localmente. **O que NÃO foi
feito:** captura de tráfego real com proxy (Charles/mitmproxy) contra um build instalado em
device/emulador Android ou simulador/device iOS. Este ambiente (host Windows, sem emulador Android
rodando nem simulador iOS disponível) não tem como produzir essa evidência — está registrado aqui
como pendência explícita, não fingido como concluído.

## Resultado da análise estática (evidência real, comandos rodados nesta sessão)

### 1. Clientes HTTP declarados em build

```
grep -r "ktor\|okhttp\|retrofit\|Alamofire\|URLSession" aplicativo/gradle/libs.versions.toml
  aplicativo/**/build.gradle.kts aplicativo/iosApp/Podfile
```

Resultado: **nenhuma ocorrência**. Confirmado por leitura completa de
`aplicativo/gradle/libs.versions.toml` (28 chaves em `[libraries]`, nenhuma de cliente HTTP) e de
todos os 12 arquivos `build.gradle.kts` do projeto.

### 2. Código-fonte com import de rede

Grep por `Log\.|println|NSLog` (ver `contrato-redaction-savro.md`) já cobriu toda a árvore; grep
adicional específico de rede (`io.ktor|okhttp|retrofit|URLSession|NSURLSession|HttpURLConnection`)
em todos os `.kt`/`.swift` de `aplicativo/` (exclusive `build/`): **nenhuma ocorrência**.

### 3. Manifests e entitlements

- `androidApp/src/main/AndroidManifest.xml`: **sem** `<uses-permission android:name=
  "android.permission.INTERNET"/>` nem `ACCESS_NETWORK_STATE`. Sem essa permissão, o processo do
  app **não consegue** abrir socket algum no Android — não é só "não chama rede hoje", é
  estruturalmente impedido pelo SO até alguém adicionar a permissão de propósito.
- `iosApp/iosApp/Info.plist`: **sem** chave `NSAppTransportSecurity` — significa que o app herda o
  comportamento padrão mais restritivo do ATS (bloqueia HTTP puro, exige TLS 1.2+ quando uma
  conexão eventualmente existir). Não há nenhuma exceção de domínio, nem `NSAllowsArbitraryLoads`.
  Como o app não abre conexão nenhuma, essa configuração é hoje irrelevante na prática, mas confirma
  que ninguém abriu uma brecha "por precaução" para um recurso que não existe.
- `iosApp/Configuration/*.xcconfig`: sem entitlement de rede (`com.apple.developer.networking.*`)
  nem `Associated Domains`/App Links relacionados a rede de dados.

### 4. WebView / Capacitor legado

Nenhum `WebView`/`WKWebView` referenciado em nenhum arquivo Kotlin/Swift do projeto `aplicativo/`.
O código legado React/Capacitor mencionado na ADR-001/ADR-002 vive fora de `aplicativo/`, em outra
parte do monorepo, e não é dependência nem é importado pelo módulo Gradle do Savro (confirmado por
`settings.gradle.kts`, que só inclui os módulos `:shared:*` e `:androidApp`).

### 5. Serviços em segundo plano

Nenhum `WorkManager`/`BGAppRefreshTask`/`BGProcessingTask` declarado hoje (grep por
`androidx.work`/`BGTaskScheduler`/`BGAppRefreshTask`: nenhuma ocorrência fora de comentários da
ADR-002 descrevendo arquitetura futura). Não há, portanto, nenhum job de segundo plano que possa
abrir conexão.

### 6. DNS / sockets de baixo nível

Nenhum uso de `java.net.Socket`, `java.net.DatagramSocket`, `platform.Network` (Network.framework),
`NWConnection`, ou qualquer API de socket cru em nenhum arquivo do projeto.

## Confirmação: MVP1 funciona 100% sem rede

Com base nas seis verificações acima, o MVP1 do Savro **não tem caminho técnico para abrir uma
conexão de rede** — nem por dependência declarada, nem por import de código, nem por permissão do
SO (Android bloqueia no nível de sandbox sem a permissão `INTERNET`). Isso é mais forte que "os
testes passaram sem rede": é uma garantia estrutural de duas camadas independentes (ausência de
permissão + ausência de dependência/código).

## Gate automatizado adicionado nesta issue

Tarefa Gradle nova `verifyNoNetworkAccess` (`aplicativo/build.gradle.kts`), rodada localmente nesta
auditoria com sucesso (`BUILD SUCCESSFUL`, 3 tarefas executadas junto com `verifyArchitecture`/
`verifyDesignSystemTokens`):

- Estende as listas já existentes de referências proibidas (`forbiddenCommonMainReferences`,
  `forbiddenAndroidMainReferences`, `forbiddenIosMainReferences`) com padrões de cliente de rede
  (`io.ktor.client.`, `okhttp3.`, `retrofit2.`, `com.squareup.okhttp`,
  `java.net.HttpURLConnection`, `java.net.URLConnection`, `javax.net.ssl.HttpsURLConnection`,
  `platform.Foundation.NSURLSession`, `platform.Foundation.NSURLConnection`, `platform.Network.`) —
  essas listas já são aplicadas a **todos** os módulos `:shared:*` (não só os "puros"), então a
  cobertura é para `:shared:core:database`, `:shared:core:security`, `:shared:core:backup` e
  `:shared:app` também, não só `:shared:core:common`/`:shared:core:model`/`:shared:domain:patrimonio`.
- Nova tarefa dedicada varre também `androidApp/src/main/kotlin` (Kotlin) e `iosApp/iosApp/*.swift`
  (Swift, incluindo `URLSession`, `NSURLSession`, `Alamofire`, `dataTask(with:`) — módulos que não
  estavam cobertos pelo `verifyArchitecture` original porque `:androidApp` não está em
  `sharedModulePaths` e `:iosApp` fica fora do grafo Gradle por definição da ADR-002.
- Adicionada ao job `arquitetura-e-design-system` do `aplicativo-ci.yml` (roda em toda PR que toca
  `aplicativo/**`).

Isso cobre o critério de aceite "gate que falha se aparecer import de client HTTP nas camadas
patrimoniais" com verificação real, executável, já rodada localmente com sucesso.

## Evidência separada Android vs. iOS (honestidade sobre o que foi testado)

| Verificação | Android | iOS |
|---|---|---|
| Ausência de permissão/entitlement de rede | ✅ Confirmado — `AndroidManifest.xml` lido integralmente | ✅ Confirmado — `Info.plist` e `.xcconfig` lidos integralmente |
| Ausência de dependência de cliente HTTP | ✅ Confirmado — `libs.versions.toml` e todos os `build.gradle.kts` | ✅ Confirmado — `Podfile` (só declara SQLCipher) |
| Ausência de import de rede no código-fonte | ✅ Confirmado — grep em `androidMain`/`commonMain` | ✅ Confirmado — grep em `iosMain`/`commonMain`/Swift |
| Gate automatizado rodado com sucesso | ✅ Rodado localmente nesta sessão (`verifyArchitecture`/`verifyNoNetworkAccess`, JVM/Ubuntu-equivalente) | ⚠️ Gate roda em Kotlin puro (sem precisar de toolchain iOS) e varre arquivos Swift por texto — **não precisa** de macOS para rodar, mas o build real do framework iOS (`ios-xcode-macos` da CI) não foi executado nesta sessão |
| Captura de tráfego real com proxy (device/emulador/simulador) | 🚫 **Não executado** — sem emulador Android disponível neste ambiente | 🚫 **Não executado** — sem simulador/device iOS disponível neste ambiente (host Windows) |

## Pendência explícita

**Validação manual em device pendente** para ambas as plataformas: rodar o app em modo avião com
proxy de captura ativo (Charles/mitmproxy) num build real instalado em emulador Android e simulador
iOS, confirmando zero handshake de rede durante um fluxo completo (onboarding → cadastro → backup →
restauração). Recomendação: Rhodolfo/QA ou quem tiver acesso a device físico/emulador real deveria
executar isso como parte do processo de release, não como bloqueio desta issue — a garantia
estrutural (sem permissão de Internet no Android, sem dependência de rede em lugar nenhum) já torna
essa captura mais uma confirmação do que uma descoberta esperada.
