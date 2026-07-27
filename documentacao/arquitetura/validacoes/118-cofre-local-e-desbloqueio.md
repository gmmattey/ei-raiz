# 118 — cofre local protegido e fluxo de desbloqueio (Android + iOS)

- **Issue:** [#118](https://github.com/gmmattey/esquilo-wallet/issues/118) (filha de #116/#117)
- **Predecessoras obrigatórias já concluídas:** ADR-002 aprovada em #192, fundação KMP #193,
  persistência cifrada #180 (`ProvedorChaveMestra`, `RepositorioItensPatrimoniais`,
  `:shared:core:database`). Este documento não é uma ADR nova — registra decisões técnicas de
  implementação por cima do que já estava aprovado, conforme pedido explícito do escopo desta
  issue.

## Módulo criado: `:shared:core:security`

A ADR-002 já previa isso ("`ProvedorChaveMestra` hospedado em `:shared:domain:patrimonio` até
`:shared:core:security` ser extraído"). Esta issue cria o módulo:

```text
:shared:core:security → :shared:core:common, :shared:core:model, :shared:domain:patrimonio
:shared:app           → :shared:core:security (api, não implementation — ver "Wiring do host Android")
```

Contratos comuns (`commonMain`, sem nenhuma referência a `android.*`/`androidx.*`/`platform.*`):

- `EstadoCofre` — os 8 estados obrigatórios da issue.
- `PoliticaProtecao` (`Nenhuma` / `Ativada(permitirCredencialDispositivo)`).
- `AutenticadorBiometrico`, `DisponibilidadeBiometria`, `ResultadoAutenticacao` — contrato de
  biometria/credencial de dispositivo.
- `PreferenciasCofre` — onboarding concluído, política ativa, timeout de inatividade, flag de
  chave invalidada. Nenhum valor aqui é material criptográfico (isso continua sendo só o
  Keystore/Keychain via `ProvedorChaveMestra`, #180).
- `GerenciadorCofre` — a máquina de estados de fato, orquestrando `ProvedorChaveMestra` +
  `RepositorioItensPatrimoniais` (#180) + `AutenticadorBiometrico` + `PreferenciasCofre` +
  `Relogio`. 100% testável com fakes em `commonTest` (`GerenciadorCofreTest`, 15 casos).

## Decisões da máquina de estados

- **`BloqueioTemporario` nunca é contagem própria do Savro** — é sempre o sinal nativo da
  plataforma (`BiometricPrompt.ERROR_LOCKOUT` no Android, `LAErrorBiometryLockout` no iOS).
  Inventar um contador de tentativas próprio duplicaria uma política que o sistema operacional já
  aplica e criaria dois relógios de bloqueio divergentes.
- **`ChaveInvalidada` vs. `RestauracaoNecessaria`** — `ChaveInvalidada` é o instante em que
  `ErroRepositorio.ChaveInvalida` é detectado pela primeira vez (a UI mostra a explicação);
  `RestauracaoNecessaria` é o estado de repouso permanente depois que a UI reconhece a mensagem
  (`reconhecerChaveInvalidada()`), e também o estado de entrada direta em qualquer abertura futura
  do app (via `PreferenciasCofre.chaveInvalidadaPersistida()`) — evita repetir uma consulta ao
  Keystore/Keychain que já se sabe permanentemente inválida. Em nenhum dos dois casos o banco
  físico é apagado ou recriado — só o estado muda.
- **`BiometriaIndisponivel` permite continuar sem proteção diretamente** — a chave mestra
  (#180) nunca exige autenticação de usuário no nível do Keystore/Keychain
  (`setUserAuthenticationRequired` fica de fora de propósito, comentário original de #180);
  biometria é inteiramente uma política de app. Por isso, remover a proteção
  (`GerenciadorCofre.removerProtecao()`) nunca depende de já estar desbloqueado.

## Wiring do host Android (`:shared:app` androidMain, novo)

`:androidApp` continua só dependendo de `:shared:app` (regra da ADR-002/`verifyArchitecture`) —
mas o host Android precisa enxergar `GerenciadorCofre` e `AutenticadorBiometricoAndroid`
diretamente porque `BiometricPrompt` exige uma `FragmentActivity` viva, atualizada a cada
`onResume`/`onPause` (a Activity pode ser recriada). Isso obrigou a mudar a dependência de
`:shared:app` em `:shared:core:security` de `implementation` para `api` — decisão registrada aqui
porque não é óbvia a partir do diff isolado.

`MainActivity` agora estende `FragmentActivity` (em vez de `ComponentActivity` — `FragmentActivity`
já estende `ComponentActivity`, `setContent` do Compose continua igual) e aplica `FLAG_SECURE` no
`onCreate`, antes de qualquer composição.

**Limitação conhecida e registrada, não escondida:** `ComposicaoCofreAndroid` (e portanto
`GerenciadorCofre`) é recriado a cada `onCreate` da Activity, inclusive em recriação por rotação —
não há retenção via `ViewModel` nesta primeira versão. Aceitável para o MVP: a suíte suporta
portrait único (mesma política do host iOS, que já trava orientação).

`ProvedorChaveMestraAndroid.keyStore` deixou de ser inicializado eager no construtor e passou a
`by lazy` — sem essa mudança, simplesmente construir `MainActivity` sob Robolectric (sem nunca
chamar `abrir()`) já lançava `NoSuchAlgorithmException` (`"AndroidKeyStore"` não é um provider
registrado no ambiente de teste), quebrando qualquer teste de Activity, incluindo o novo
`MainActivitySnapshotProtectionTest`. Correção pontual, comportamento de produção idêntico.

## iOS: achado real de compilação (não hipotético)

Diferente de `:shared:core:database` (bloqueado por cinterop CocoaPods em qualquer host não-mac),
`:shared:core:security` **não** usa CocoaPods — só bindings padrão de `platform.LocalAuthentication`
e `platform.Foundation`, que Kotlin/Native já distribui pré-compilados mesmo para hosts Linux/Windows.
Isso permitiu compilar de verdade `AutenticadorBiometricoIOS`/`PreferenciasCofreIOS` neste ambiente
(sem Mac) e pegar dois erros reais antes do PR abrir:

1. Os casos de `LAError` (`LAErrorBiometryNotAvailable`, `LAErrorBiometryLockout` etc.) não são
   membros aninhados de um `enum class LAError` — são constantes de nível de topo no pacote
   `platform.LocalAuthentication` (mesmo padrão de `LAPolicyDeviceOwnerAuthentication`, que já
   funcionava). Corrigido para importar cada caso diretamente.
2. `NSDate().timeIntervalSince1970` não resolveu no klib desta toolchain (`Unresolved reference`) —
   trocado por `platform.posix.time(null)` (segundos, convertido para ms) em
   `AutenticadorBiometricoIOS` e também em `RelogioDoSistemaIOS` (novo, ver abaixo), que tinha o
   mesmo padrão. Perde precisão de subsegundo, irrelevante para timestamps e timeout de
   inatividade do cofre.

`:shared:core:security:compileKotlinIosArm64`/`compileKotlinIosSimulatorArm64` e a compilação do
`commonTest` para `iosSimulatorArm64` (`GerenciadorCofreTest`) passam neste host — a execução real
(`iosSimulatorArm64Test`) continua `SKIPPED` sem macOS, como o resto do projeto.

**`:shared:app` agora depende de `:shared:core:database` de verdade** (wiring que a #180 deixou
deliberadamente pendente para esta issue). Consequência já antecipada pelo relatório da #180: a
partir de agora, o job `ios-compilacao-linux` da CI deixa de pegar erro de tipagem do `iosMain` de
`:shared:core:database` *e* de `:shared:app` (cascata: como o klib de `:shared:core:database` é
pulado silenciosamente nesse host, `:shared:app` "compila" contra um klib incompleto e local o
teste falha por referência não resolvida a símbolos que existem de verdade no macOS). Confirmado
localmente: `RelogioDoSistemaIOS` (criado nesta issue) não resolve a partir de `:shared:app` neste
host, exatamente pelo motivo acima — não é bug do código, é a limitação já documentada. A validação
real de `:shared:app`/`:iosApp` para iOS continua sendo só o job `ios-xcode-macos`.

## Relógio real do iOS (`RelogioDoSistemaIOS`, novo)

`RepositorioItensPatrimoniaisSQLCipher` (#180) exige um `Relogio` real sem valor padrão, mas
`:shared:app`/`:iosApp` nunca tinham consumido `:shared:core:database` antes — não existia uma
implementação real de `Relogio` para iOS. Criada nesta issue (`io.savro.database.RelogioDoSistemaIOS`),
mesma fronteira de `RelogioDoSistemaAndroid` (que deixou de ser `internal` para ser reaproveitado
pelo wiring do cofre em `:shared:app`).

## CI: lacuna real corrigida (não introduzida por esta issue)

`:shared:core:database:testDebugUnitTest` (Room real via Robolectric, migrations, contrato) tinha
suíte própria desde a #180 mas **não estava em nenhum job de `aplicativo-ci.yml`** — lacuna
descoberta ao adicionar a suíte nova de `:shared:core:security`. Corrigido: o job
`testes-comuns` agora roda os dois módulos.

## Onboarding e telas (`:shared:app` commonMain)

Três etapas (dados locais, sem conta, sem recuperação automática) seguidas de uma tela de escolha
de proteção com "continuar sem biometria" explícito — nenhuma etapa pede dado pessoal. O catálogo
técnico de design system que ocupava `SavroApp()` (issue #194) foi removido do ponto de entrada
principal — não é referenciado por nenhum teste; os componentes que ele exercitava continuam
cobertos pelos próprios testes do design system (`:shared:core:designsystem`).

`Home` é só o placeholder mínimo pedido pela issue, com o único ponto funcional exigido pelos
critérios de aceite: ativar/alterar/remover a proteção do cofre.

## Snapshot/app switcher

- **Android:** `FLAG_SECURE` em `MainActivity.onCreate` (antes da composição) — cobre screenshot,
  gravação de tela e miniatura no Recents.
- **iOS:** SwiftUI não tem equivalente direto a `FLAG_SECURE`. `iOSApp.swift` observa `scenePhase`
  e sobrepõe um `UIVisualEffectView` (blur) sempre que a cena não está `.active` — técnica padrão
  da Apple para cobrir o snapshot que o sistema tira ao entrar em segundo plano/app switcher.
  `.onChange(of:)` usa a assinatura de parâmetro único (não a de dois parâmetros do iOS 17) porque
  o deployment target do `iosApp.xcodeproj` é 15.0.

## Pendências reais (não escondidas atrás de "feito")

1. **Validação real do lado iOS** (`AutenticadorBiometricoIOS`, `PreferenciasCofreIOS`, wiring de
   `ComposicaoCofreIOS`, `iOSApp.swift`/`ContentView.swift`) depende do job `ios-xcode-macos` da
   CI — primeira execução real de verdade é a run desta PR.
2. **Retenção de estado do cofre entre rotações de tela (Android)** — não implementada nesta
   versão (ver "Wiring do host Android" acima).
3. **`androidInstrumentedTest`/dispositivo real** — comportamento real de `BiometricPrompt` com
   diálogo do sistema e o `KeyPermanentlyInvalidatedException` de verdade não são exercitáveis sem
   emulador/dispositivo físico, igual à limitação já registrada pela #180 para SQLCipher.
4. **Backup/restauração (`*.savrobackup`)** — fora de escopo (#121); o estado
   `RestauracaoNecessaria` só explica e bloqueia, não implementa a restauração em si.
