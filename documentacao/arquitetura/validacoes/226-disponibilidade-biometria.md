# 226 — disponibilidade real de biometria (Android + iOS)

- **Issue:** [#226](https://github.com/gmmattey/esquilo-wallet/issues/226)
- **Predecessora:** #118 (`:shared:core:security`, `documentacao/arquitetura/validacoes/118-cofre-local-e-desbloqueio.md`)
  — este documento registra o que #226 corrigiu por cima do que #118 já tinha entregue, não repete
  o que já estava lá.

## Achado da auditoria (o que motivou a issue)

`CofreOnboarding.kt` (tela "Proteja seu cofre") documentava a própria lacuna no código:

> "Pendência real (registrada, não resolvida aqui): não há contrato disponível para checar se o
> aparelho tem biometria configurada sem mudar `GerenciadorCofre`/`AutenticadorBiometrico` — as
> três opções ficam sempre habilitadas, diferente do protótipo."

Ou seja: as opções "Biometria" e "Credencial do aparelho" apareciam sempre marcáveis, mesmo em um
aparelho sem sensor, sem biometria cadastrada ou sem PIN/senha configurado — o usuário só descobria
que a proteção não funcionava na primeira tentativa real de desbloqueio (`EstadoCofre.BiometriaIndisponivel`,
sem motivo nenhum anexado, então a mensagem era sempre genérica).

Dois bugs reais de mapeamento também apareceram na auditoria do lado iOS (não hipotéticos —
encontrados lendo `LAContext`/`LAError` contra a documentação da Apple):

1. `LAErrorPasscodeNotSet` era mapeado para `SemHardware` — sugeria "sem sensor" quando o problema
   real era "sem código do aparelho configurado" (mensagem incoerente com a causa, item explícito
   da auditoria pedida na issue).
2. `LAErrorBiometryLockout` era mapeado como bloqueio **temporário** de 30s fixos
   (`time(null) * 1000L + 30_000L`). A documentação da Apple para esse código é clara: o bloqueio
   só é resetado confirmando a credencial do aparelho, não por tempo — o equivalente correto é
   `ERROR_LOCKOUT_PERMANENT` do Android, não `ERROR_LOCKOUT`. Corrigido nos dois lugares que faziam
   esse mapeamento (`disponibilidade()` e `autenticar()`).

| Plataforma | Detecção atual (antes) | Problema | API correta | Ação |
|---|---|---|---|---|
| Android | `BiometricManager.canAuthenticate(STRONG\|DEVICE_CREDENTIAL)` único, sem diferenciar causa | `SemHardware` e "sem PIN/senha nenhum" retornavam o mesmo código de erro (`NO_HARDWARE`), UI não distinguia | `canAuthenticate` chamado também isolado por `DEVICE_CREDENTIAL` para diferenciar as duas causas | `mapearDisponibilidade` (novo, puro, testável) |
| Android | `ERROR_LOCKOUT_PERMANENT` mapeado para `FalhaCredencial` (texto livre) | Não distinguível de uma senha errada comum — UI não sabia oferecer o fallback certo | `ResultadoAutenticacao.BloqueioPermanente` (novo caso) | `mapearErro` corrigido |
| iOS | `LAErrorPasscodeNotSet` → `SemHardware` | Mensagem incoerente ("sem sensor" quando falta é PIN/senha) | `LAErrorPasscodeNotSet` → `SemCredencialDispositivo` | `mapearDisponibilidade` (novo, puro, testável) |
| iOS | `LAErrorBiometryLockout` → bloqueio **temporário** de 30s fixos | Semanticamente errado — a Apple exige confirmar a credencial do aparelho para resetar, não é temporizado | `LAErrorBiometryLockout` → `BloqueadaPermanentemente`/`ResultadoAutenticacao.BloqueioPermanente` | `mapearDisponibilidade`/`mapearErro` corrigidos |
| Ambas | `DisponibilidadeBiometria` com 4 casos (`Disponivel`/`SemHardware`/`NaoConfigurada`/`TemporariamenteIndisponivel(String)`) | Não cobria "sem credencial do aparelho", "bloqueada permanentemente", "erro desconhecido" — UI não conseguia diferenciar causa nem decidir fallback | Modelo de 8 casos, sem `String` livre nos casos determinísticos | `DisponibilidadeBiometria.kt` reescrito |
| `:shared:app` | `TelaEscolherProtecao`/`SecaoProtecao` nunca consultavam disponibilidade real | Opção "Biometria"/"Credencial do aparelho"/"Ativar proteção" sempre habilitada, mesmo indisponível | `GerenciadorCofre.disponibilidadeBiometrica(permitirCredencialDispositivo)` (novo, nunca mostra prompt) | `CofreOnboarding.kt`/`AjustesScreens.kt` atualizados |

## Modelo compartilhado (`commonMain`)

`DisponibilidadeBiometria` (`:shared:core:security`) passou de 4 para 8 casos: `Disponivel`,
`SemHardware`, `NaoConfigurada`, `SemCredencialDispositivo` (novo), `BloqueadaTemporariamente`
(novo, com horário opcional — a checagem de disponibilidade nem sempre sabe o horário exato, ao
contrário de uma tentativa real), `BloqueadaPermanentemente` (novo), `Indisponivel` (novo, genérico
transitório) e `ErroDesconhecido` (novo, com motivo — nunca finge "disponível" para um código não
mapeado).

`AutenticadorBiometrico.disponibilidade()` passou a receber `permitirCredencialDispositivo: Boolean`
— a mesma checagem de disponibilidade tem que refletir exatamente a combinação de autenticadores
que a política em uso vai pedir (checar sempre a combinação "com credencial" e depois tentar
autenticar "sem credencial" já produzia falso positivo/negativo). A UI chama duas vezes (uma para
cada valor) quando precisa diferenciar as opções "Biometria" e "Credencial do aparelho" — nunca
mostra prompt, só consulta o sistema (`BiometricManager.canAuthenticate`/`LAContext.canEvaluatePolicy`).

`DecisaoOpcaoProtecao` (novo, `:shared:core:security`, sem Compose/plataforma) centraliza a decisão
pura: `habilitada()`, `permiteTentarNovamente()`, `permiteContinuarSemProtecao()` — nenhuma tela
decide isso "na unha" com `when` espalhados. Testado isoladamente em `DecisaoOpcaoProtecaoTest`.

`EstadoCofre.BiometriaIndisponivel` deixou de ser `data object` e passou a `data class(motivo:
DisponibilidadeBiometria)` — a UI do painel de erro (`CofreScreens.kt`) usa o motivo para escolher
título, mensagem e se oferece "Tentar novamente" (via `DecisaoOpcaoProtecao.permiteTentarNovamente`).
"Continuar sem proteção" continua sempre presente nesse painel — garantia herdada da #118 de que o
usuário nunca fica preso fora do cofre por causa de detecção errada de biometria.

`GerenciadorCofre.disponibilidadeBiometrica(permitirCredencialDispositivo)` (novo, público) expõe a
checagem pura para a UI sem vazar `AutenticadorBiometrico` para fora do módulo.

## Android

`AutenticadorBiometricoAndroid.disponibilidade()` reescrito: continua usando só `BIOMETRIC_STRONG`
(e `DEVICE_CREDENTIAL` quando a política permite) — `BIOMETRIC_WEAK` deliberadamente fora, igual
antes, por não haver decisão de produto pedindo essa combinação. O mapeamento puro
(`mapearDisponibilidade`, função de nível de topo, sem depender de `Context`) cobre todos os
retornos relevantes de `canAuthenticate`: sucesso, sem hardware, sem cadastro, atualização de
segurança pendente, não suportado, status desconhecido — e diferencia "sem hardware" de "sem
credencial do aparelho nenhuma" checando `DEVICE_CREDENTIAL` isolado quando a combinação
`STRONG|DEVICE_CREDENTIAL` falha (o Android devolve o mesmo código de erro para os dois casos).

`mapearErro` (erros terminais de `BiometricPrompt`) ganhou `ERROR_LOCKOUT_PERMANENT` →
`ResultadoAutenticacao.BloqueioPermanente` (era `FalhaCredencial` com texto livre).

Testado via Robolectric (`AutenticadorBiometricoAndroidTest`, 15 casos) — como o ambiente não tem
hardware/emulador real, `mapearDisponibilidade`/`mapearErro` são funções puras exercitadas
diretamente com os próprios constantes de `BiometricManager`/`BiometricPrompt`, sem precisar
simular um aparelho físico.

## iOS

`AutenticadorBiometricoIOS.disponibilidade()` reescrito: `canEvaluatePolicy` (nunca dispara prompt)
com `LAPolicyDeviceOwnerAuthenticationWithBiometrics` (biometria isolada) ou
`LAPolicyDeviceOwnerAuthentication` (biometria ou passcode), conforme o parâmetro — cada checagem
usa uma `LAContext()` nova (padrão recomendado pela Apple, mesma regra já seguida por `autenticar`).

`mapearDisponibilidade`/`mapearErro` viraram funções de nível de topo/`internal`, puras, recebendo
`NSError?` — testáveis com instâncias reais de `NSError(domain: LAErrorDomain, code:, userInfo:
nil)` sem sensor físico nem mock de `LAContext`.

Nenhuma SPI privada da Apple foi usada (regra do projeto) — só `LocalAuthentication` público, os
mesmos símbolos já em uso desde a #118.

**Novidade estrutural:** o módulo ganhou source set `iosTest` (`src/iosTest/kotlin/...`,
`AutenticadorBiometricoIOSTest.kt`) — não existia nenhum antes no repo (nem em `:shared:core:backup`,
que também tem `iosMain`). Funciona sem alterar `build.gradle.kts` graças ao "default hierarchy
template" do Kotlin Multiplatform (ativo desde 1.9.20; o projeto está em 2.3.10), que já conecta
`iosMain`/`iosTest` a `iosArm64`/`iosSimulatorArm64` automaticamente. Compilado localmente neste
host (`compileTestKotlinIosSimulatorArm64`, sem CocoaPods — mesma razão pela qual `:shared:core:security`
já compilava em Linux desde a #118); a execução real depende do job `ios-xcode-macos`.

## CI

`aplicativo-ci.yml` (`ios-xcode-macos`) ganhou o step "Testar máquina de estados do cofre e
biometria no simulador iOS" (`:shared:core:security:iosSimulatorArm64Test`) — **lacuna real
corrigida, não introduzida por esta issue**: o módulo já existia desde a #118, mas nenhum job de CI
executava seu `commonTest`/`iosTest` no simulador, só compilava (`ios-compilacao-linux`, sem
`Test`). Essa run é a primeira execução real do runtime Kotlin/Native para este módulo.

## Compatibilidade

Nenhuma migração de banco — `DisponibilidadeBiometria`/`EstadoCofre`/`ResultadoAutenticacao` são
tipos de domínio em memória, nunca persistidos (`PreferenciasCofre` guarda só `PoliticaProtecao`,
inalterada). Cofres já criados, política de proteção já escolhida e o fluxo de quem usa só
senha/PIN (`PoliticaProtecao.Nenhuma`) continuam exatamente como antes — a mudança é só na precisão
da checagem de disponibilidade antes de oferecer/tentar a proteção biométrica.

## Limitações registradas (não escondidas)

- Sem device físico/emulador Android neste ambiente: `mapearDisponibilidade`/`mapearErro` do
  Android são testados como funções puras (constantes reais da lib), não contra hardware real —
  mesma limitação já registrada pela #118 para `BiometricPrompt`.
- Sem macOS neste ambiente: `AutenticadorBiometricoIOS.disponibilidade()`/`autenticar()` (as
  chamadas reais a `LAContext`) só são validadas de verdade pelo job `ios-xcode-macos` — o que este
  ambiente valida é a compilação real (klib) e a execução dos mapeamentos puros com `NSError`
  reais em `iosTest`.
- `SecaoProtecao` (`AjustesScreens.kt`) checa disponibilidade só para o botão "Ativar proteção"
  (combinação padrão, `permitirCredencialDispositivo = true`) — a alternância do chip "Permitir
  código do aparelho além de biometria" numa proteção já ativa não foi gated por uma nova checagem
  (fora do escopo desta issue, que pede ajuste de estados/mensagens de uma opção existente, não
  redesenho); o usuário continua protegido contra ficar preso fora do cofre porque
  `GerenciadorCofre.autenticarEAbrir()` já checa a disponibilidade real com a política efetivamente
  configurada antes de qualquer tentativa.
