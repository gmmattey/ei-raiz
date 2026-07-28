# Modelo de ameaças — Savro (issue #130)

Cobre o MVP1 real do Savro (KMP, Android + iOS) no estado do repositório em 2026-07-28 (branch
`master`, commit `66b73e6`). Segue a ADR-002 e a regra de ouro do produto: **nenhuma posição,
quantidade, saldo, instituição, aporte, ajuste, evento de timeline, backup ou CSV sai do
aparelho**, em nenhuma das duas plataformas.

Escopo desta auditoria: código real em `aplicativo/shared/*`, `aplicativo/androidApp`,
`aplicativo/iosApp`, arquivos de build (`build.gradle.kts`, `libs.versions.toml`, `Podfile`),
manifests/plists, e `.github/workflows/aplicativo-ci.yml`. Não inclui execução de proxy de rede
real contra dispositivo/emulador nem inspeção manual de binário além do que a CI já faz (ver
`auditoria-rede-savro.md` para o que foi de fato verificado vs. o que é análise estática).

Convenção desta tabela: **Mitigação atual** cita arquivo/linha real; **Risco residual** é honesto
mesmo quando desconfortável; **Evidência** diz o que comprova a mitigação (teste automatizado,
leitura de código, ou "nenhuma — pendente").

## 1. Banco local cifrado (`savro.db`)

| Item | Detalhe |
|---|---|
| Ativo protegido | Nome, valor, moeda, instituição, observação, tipo, ajustes e timeline de cada item patrimonial. |
| Vetor | Acesso ao arquivo do banco por outro processo/app, backup do SO, extração forense do aparelho, cópia do arquivo. |
| Impacto | Exposição de patrimônio completo do usuário. |
| Mitigação atual | Android: Room 2.8.4 sobre SQLCipher (`net.zetetic:sqlcipher-android:4.17.0`) via `SupportOpenHelperFactory` (`RepositorioItensPatrimoniaisRoom.kt`). iOS: SQLCipher via cinterop CocoaPods, `sqlite3_key` aplicado antes de qualquer outra operação (`SQLiteCifrado.kt`). Chave nunca é `null`/vazia nas duas plataformas — vem sempre de `ProvedorChaveMestra`. |
| Risco residual | SQLCipher/AES protege em repouso; não protege contra processo comprometido em execução (malware com acesso ao processo enxerga dados decifrados, igual documentado para o backup). Nenhuma primitiva criptográfica é implementada pelo Savro — depende da corretude do SQLCipher/OpenSSL/BoringSSL subjacente. |
| Evidência | Teste de contrato `RepositorioItensPatrimoniaisContratoTeste`/`RoomRepositorioItensPatrimoniaisContratoTest` (Robolectric) e `SQLCipherRepositorioItensPatrimoniaisContratoTest` (iOS, roda só na CI macOS). Comportamento de chave errada real (`KeyPermanentlyInvalidatedException`, "file is encrypted or is not a database") **não é testável em Robolectric** (biblioteca nativa incompatível com o host JVM) — depende de `androidInstrumentedTest` em dispositivo/emulador real, que não roda neste ambiente nem na CI atual (lacuna registrada desde a #180, não desta auditoria). |

## 2. Chave mestra do cofre (Android Keystore / iOS Keychain)

| Item | Detalhe |
|---|---|
| Ativo protegido | Passphrase de 256 bits que abre o SQLCipher. |
| Vetor | Extração da chave do Keystore/Keychain, engenharia reversa do app, dump de memória. |
| Impacto | Se a chave vazar, o banco cifrado se torna legível (mesmo texto claro de antes). |
| Mitigação atual | **Android**: chave AES-256 não exportável no Android Keystore (alias `savro.vault.master.v1`, `KeyProperties.PURPOSE_ENCRYPT/DECRYPT`, sem `setUserAuthenticationRequired` — ver nota abaixo), usada para encapsular (AES-GCM) uma passphrase aleatória gravada em `context.noBackupFilesDir` (`ProvedorChaveMestraAndroid.kt`). **iOS**: passphrase gerada com `SecRandomCopyBytes` e guardada como `kSecClassGenericPassword` com `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` + `kSecAttrSynchronizable = false` — nunca sincroniza para iCloud Keychain, nunca sai do aparelho de origem (`ProvedorChaveMestraIOS.kt`). |
| Risco residual | **Nota importante, não é falha:** nem a chave do Keystore/Keychain nem o Room/SQLite exigem autenticação biométrica para ler — quem gate-keeps o acesso é a máquina de estados do cofre (`GerenciadorCofre`, #118), uma decisão de UX/app, não do Keystore. Um atacante com acesso root/jailbreak ao aparelho desbloqueado pode, em tese, contornar a UI e chamar o provedor de chave diretamente — **este é um limite conhecido e aceito**: o Savro não promete proteção contra aparelho root/jailbreak comprometido (ver seção 12). Em aparelho **não comprometido**, a chave nunca sai do enclave protegido pelo SO. |
| Evidência | `GerenciadorCofreTest` (commonTest, cobre a máquina de estados com fakes). `ProvedorChaveMestraIOS`/`SQLiteCifrado` **não foram compilados neste ambiente** (host Windows sem toolchain iOS) — validação real depende do job `ios-xcode-macos` da CI, como o próprio código documenta. |

## 3. Biometria / credencial do dispositivo

| Item | Detalhe |
|---|---|
| Ativo protegido | Acesso à tela de patrimônio após o app ser aberto. |
| Vetor | Bypass do prompt biométrico, timeout de inatividade mal configurado, biometria alterada sem invalidar sessão. |
| Impacto | Acesso não autorizado ao patrimônio com o aparelho em mãos de terceiro. |
| Mitigação atual | Android: `BiometricPrompt` com `BIOMETRIC_STRONG` (+ `DEVICE_CREDENTIAL` opcional) (`AutenticadorBiometricoAndroid.kt`). iOS: `LAContext`/`LocalAuthentication` com `LAPolicyDeviceOwnerAuthenticationWithBiometrics`/`...Authentication` (`AutenticadorBiometricoIOS.kt`). Timeout de inatividade configurável (padrão 60s, `PreferenciasCofrePadrao.TIMEOUT_INATIVIDADE_MS_PADRAO`) fecha o repositório e reavalia o estado ao voltar do background (`GerenciadorCofre.notificarAppEmPrimeiroPlano`). |
| Risco residual | Política de proteção é **opcional** — usuário pode escolher `PoliticaProtecao.Nenhuma` no onboarding (decisão de produto documentada, #118: "permitir continuar sem biometria, com aviso claro"). Nesse caso não há gate nenhum além de abrir o app. |
| Evidência | `GerenciadorCofreTest` cobre todos os 8 estados (`EstadoCofre`) via fakes. Comportamento real do `BiometricPrompt`/`LAContext` (diálogo do sistema, `BIOMETRIC_LOCKOUT` real) não é testável fora de dispositivo/emulador real — não executado neste ambiente. |

## 4. Memória em execução

| Item | Detalhe |
|---|---|
| Ativo protegido | Chave derivada, passphrase, senha de backup, bytes decifrados durante o uso do app. |
| Vetor | Dump de memória de processo comprometido; imagem de swap/hibernação do SO. |
| Impacto | Exposição de chave ou conteúdo decifrado sem precisar quebrar a cripto. |
| Mitigação atual | `ServicoBackup`/`CriptografiaBackup` zeram buffers sensíveis assim que deixam de ser necessários (`chave.fill(0)`/`Arrays.fill(chave, 0)`, ver `ServicoBackup.entregarAoSeletor`, `RepositorioItensPatrimoniaisRoom.abrirComChave`). |
| Risco residual | Documentado no próprio formato (`formato-savrobackup.md` §3.3): "melhor esforço — nem a JVM nem o Kotlin/Native garantem que não houve cópia intermediária na memória" (strings imutáveis, GC, otimizações do compilador podem manter cópias). Não há proteção adicional (ex.: `mlock`/paginação travada) — não é comum em apps mobile de terceiros e não foi considerado necessário para o MVP1. |
| Evidência | Leitura de código apenas; não há teste automatizado que confirme zeragem de memória (não é praticável em JVM/Kotlin-Native sem ferramentas externas). |

## 5. Screenshots, app switcher (recent apps) e gravação de tela

| Item | Detalhe |
|---|---|
| Ativo protegido | Qualquer valor/nome/instituição visível na tela no momento de sair para segundo plano ou tirar print. |
| Vetor | Screenshot do sistema, miniatura do app switcher, gravação de tela (nativa do SO ou app de terceiros), Assistente/Siri Screenshot proativo. |
| Impacto | Vazamento pontual de um valor específico visível naquele momento. |
| Mitigação atual | **Android**: `window.setFlags(FLAG_SECURE, FLAG_SECURE)` aplicado em `MainActivity.onCreate` — bloqueia screenshot, gravação de tela e miniatura no Recents para a Activity inteira. **iOS**: `SnapshotProtectionOverlay` (blur `UIVisualEffectView`) cobre `ContentView` sempre que `scenePhase != .active` (`iOSApp.swift`) — técnica recomendada pela Apple, já que não existe equivalente direto ao `FLAG_SECURE`. |
| Risco residual | iOS: a técnica de overlay cobre a transição para background e a miniatura do app switcher, mas **não impede** um print manual (`Screenshot` físico) enquanto o app está em primeiro plano e ativo — isso é uma limitação de plataforma (Apple não oferece um equivalente ao `FLAG_SECURE` para o app inteiro), não uma falha de implementação. Android com `FLAG_SECURE` bloqueia inclusive o print manual em primeiro plano. |
| Evidência | `MainActivitySnapshotProtectionTest.kt` (Robolectric) confirma o flag aplicado em `onCreate`. `SnapshotProtectionOverlay` **não tem teste automatizado** (comportamento de UI nativa iOS ligado a `scenePhase`, difícil de testar sem UI test real em simulador) — validado apenas por leitura de código nesta auditoria. |

## 6. Acessibilidade / árvore semântica

| Item | Detalhe |
|---|---|
| Ativo protegido | Valor real de patrimônio quando o usuário ativa "ocultar valores". |
| Vetor | Leitor de tela (TalkBack/VoiceOver) lendo o valor real mesmo com a máscara visual ativa; ferramenta de teste de UI (`onNodeWithText`) encontrando o valor na árvore de semântica mesmo oculto. |
| Impacto | Vazamento de valor a quem tem acesso físico ao aparelho com leitor de tela ativo, ou a uma automação maliciosa que leia a árvore de acessibilidade. |
| Mitigação atual | `ApresentacaoValor.texto()`/`descricaoAcessibilidade()` (`:shared:domain:patrimonio`) são funções puras que substituem **tanto o texto visível quanto o `contentDescription`** por uma máscara fixa (`"••••••"`/`"Valor oculto"`) quando oculto — nunca repassam o valor real para nenhum dos dois. `SavroPrivacyMask` (`:shared:core:designsystem`) remove o conteúdo sensível da árvore de semântica por completo quando `isVisible = false` (mostra só o texto do rótulo). |
| Risco residual | `SavroPrivacyMask` existe e é testado, mas **não está conectado a nenhuma tela de produto hoje** (`HomeScreens.kt`/`PatrimonioScreens.kt`/`DetalheScreens.kt` usam `ApresentacaoValor` diretamente, não o componente `SavroPrivacyMask`) — os dois caminhos são equivalentes em efeito (nenhum vaza o valor), mas são implementações duplicadas e não convergem num único ponto de verdade. Registrado como achado "importante" (ver seção 13). |
| Evidência | `ApresentacaoValorTest.kt` (commonTest, 4 casos incluindo "nenhum dígito sobrevive"). `SavroPrivacyMaskCommonTest`/`SavroPrivacyMaskInstrumentedTest` confirmam que o texto real `"assertDoesNotExist"` na árvore quando oculto. Os dois passam nesta auditoria (rodados localmente, ver `contrato-redaction-savro.md`). |

## 7. Backup criptografado (`*.savrobackup`, #121)

Modelo de ameaça completo e normativo em `documentacao/arquitetura/formato-savrobackup.md` §1 — não
duplicado aqui. Resumo: protege contra aparelho perdido/roubado, backup em nuvem de terceiros
(Google Drive/iCloud Drive/e-mail) e adulteração de arquivo; não protege contra senha fraca,
aparelho comprometido em execução, nem perda da senha (sem recuperação, por construção). Ver
`revisao-backup-121-issue130.md` para a revisão específica desta auditoria (nenhuma falha nova
encontrada, formato V1 não alterado).

## 8. Restauração de backup

| Item | Detalhe |
|---|---|
| Ativo protegido | Integridade do cofre atual durante uma restauração. |
| Vetor | Arquivo malformado, adulterado ou de schema incompatível recebido para restauração; interrupção no meio da restauração. |
| Impacto | Corrupção ou perda do patrimônio já cadastrado. |
| Mitigação atual | Validação completa (cabeçalho → versão → integridade HMAC → senha → consistência) acontece **antes** de qualquer escrita (`ServicoBackup.prepararRestauracao`). Aplicação em uma única transação de banco com rollback total em qualquer falha (`ServicoBackup.aplicarRestauracao`, `executarEmTransacao`). Preferências só gravam depois do commit do banco. |
| Risco residual | MVP1 é substituição total, sem mesclagem — perda intencional (avisada na prévia) dos dados atuais ao restaurar; não é um bug, é a estratégia documentada. |
| Evidência | `ServicoBackupTest.kt` (commonTest) cobre falha no meio da transação com rollback completo (`falharNaInsercaoDeNumero`). |

## 9. Exportação CSV (#121)

| Item | Detalhe |
|---|---|
| Ativo protegido | Mesmo patrimônio do backup, mas exportado como texto claro por decisão explícita do usuário. |
| Vetor | Qualquer app/pessoa com acesso ao CSV depois de compartilhado (nuvem, e-mail, outro app) lê o conteúdo diretamente. |
| Impacto | Exposição total do patrimônio — **sem** a proteção de senha do `*.savrobackup`. |
| Mitigação atual | Nenhuma cifra — **decisão de produto documentada**, não falha: `ExportadorCsv.kt` afirma explicitamente "esta saída não tem a proteção do backup criptografado" e a UI avisa antes de exportar. |
| Risco residual | Aceito e comunicado; é a natureza de uma exportação para planilha. |
| Evidência | `ExportadorCsvTest.kt` cobre escaping RFC 4180 e BOM UTF-8; não há (nem faz sentido haver) teste de "não vaza dados", já que vazar é o propósito da funcionalidade quando o usuário pede. |

## 10. Arquivos temporários (backup e CSV)

| Item | Detalhe |
|---|---|
| Ativo protegido | Cópia temporária do backup/CSV entre a geração e a entrega ao seletor nativo. |
| Vetor | Temporário sobrevivendo além do necessário, acessível por outro processo/app. |
| Impacto | Janela de exposição do conteúdo em texto claro (CSV) ou cifrado (backup) fora do fluxo pretendido. |
| Mitigação atual | Área temporária privada do app (`cacheDir/backup` no Android, `NSTemporaryDirectory()/savro-backup` no iOS) — nunca pasta pública. Removido em **qualquer** desfecho (sucesso, cancelamento, exceção) via `finally` em `ServicoBackup.entregarAoSeletor`. |
| Risco residual | Nenhum identificado nesta auditoria. |
| Evidência | Testes de limpeza de temporário citados em `formato-savrobackup.md` §7 (três testes específicos, no módulo `:shared:core:backup`). |

## 11. Seletores nativos e compartilhamento do sistema

| Item | Detalhe |
|---|---|
| Ativo protegido | Controle sobre para onde o backup/CSV vai. |
| Vetor | Seletor do sistema (SAF no Android, `UIDocumentPickerViewController` no iOS) sendo usado para enviar o arquivo a um destino inesperado. |
| Impacto | Nenhum além do que o próprio usuário escolheu — é o desenho pretendido (usuário decide o destino). |
| Mitigação atual | Savro nunca escreve fora do próprio sandbox nem pede permissão de armazenamento; quem escolhe o destino é sempre o usuário via seletor nativo do SO (`ArquivosDoSistemaAndroid`/`ArquivosDoSistemaIOS`). |
| Risco residual | Nenhum novo — o "risco" aqui é inerente à funcionalidade de compartilhar um arquivo, não uma falha. |
| Evidência | Leitura de código; comportamento do seletor nativo real não é testável fora de instrumentado/dispositivo. |

## 12. Logs, exceções e relatórios técnicos

Ver `contrato-redaction-savro.md` (deliverable dedicado, com testes automatizados reais).
Resumo do achado principal desta auditoria: os modelos patrimoniais (`ItemPatrimonial`,
`AjusteValorItem`, `EventoTimelineItem`, `ConteudoBackup`) eram `data class` sem `toString()`
próprio — o `toString()` gerado automaticamente pelo Kotlin incluiria nome, instituição,
observação, moeda e valores monetários em texto claro. Não havia (e continua não havendo) nenhum
`Log.d`/`println`/`NSLog` no código do MVP1 (confirmado por grep em toda a árvore `aplicativo/`,
fora de `build/`), então **não havia exploração ativa** — mas o `toString()` implícito era uma
mina terrestre para qualquer log futuro. Corrigido nesta auditoria (`toString()` explícito e
redigido nos quatro modelos) e travado por teste automatizado.

## 13. CI e artefatos

| Item | Detalhe |
|---|---|
| Ativo protegido | Ausência de dado patrimonial/segredo em artefato de build, log de CI ou repositório. |
| Vetor | Log de CI expondo stack trace com dado sensível; commit acidental de `*.savrobackup`/CSV real de teste; APK/framework de debug com símbolo revelador. |
| Impacto | Vazamento via canal indireto (CI, controle de versão), não via o app em si. |
| Mitigação atual | CI (`aplicativo-ci.yml`) roda só sobre dados sintéticos de teste (`itemDeTeste`, `VetoresDeReferencia`), nunca dados reais de usuário. Job `ios-xcode-macos` confirma via `nm`/`strings` a ausência do símbolo privado `CCCryptorGCM`/`kCCModeGCM` no framework linkado — evidência real, não suposição (rodada de verdade na CI, não nesta auditoria local). |
| Risco residual | Nenhum arquivo `.savrobackup`/`.csv` real está commitado no repositório (não verificado por grep de extensão nesta auditoria por não ser prático localizar "arquivo real de usuário" vs. teste — mitigado pelo gate novo desta issue, ver `testes-gates-regressao` no `contrato-redaction-savro.md`). |
| Evidência | Leitura do workflow `aplicativo-ci.yml`; não foi executado nenhum job de CI nesta auditoria (só Gradle local). |

## 14. Dependências de terceiros

Ver `inventario-dependencias-savro.md` (deliverable dedicado). Resumo: nenhum SDK de anúncio,
rastreamento, analytics invasivo, IA em nuvem ou crash reporter presente hoje. Bibliotecas
principais (SQLCipher, Bouncy Castle, Room, Compose Multiplatform, AndroidX) auditadas
individualmente.

## 15. Tráfego de rede

Ver `auditoria-rede-savro.md` (deliverable dedicado). Resumo: **zero rede no MVP1** — nenhuma
dependência de cliente HTTP declarada em nenhum módulo, nenhuma permissão de Internet no
`AndroidManifest.xml`, nenhum `NSAppTransportSecurity` no `Info.plist` (comportamento padrão do
sistema, mais restritivo). Gate automatizado novo (`verifyNoNetworkAccess`) adicionado nesta
issue para impedir regressão.

## 16. Engenharia reversa e aparelho comprometido (root/jailbreak)

**Limite honesto, não uma promessa de proteção absoluta:**

- O Savro **não implementa** detecção de root/jailbreak, nem ofuscação de código, nem
  anti-tampering, nem verificação de integridade do binário (attestation) no MVP1.
- Um aparelho **root/jailbreak comprometido** pode, em tese: ler a memória do processo do app
  enquanto ele roda (contorna qualquer cifra em repouso, já documentado em `formato-savrobackup.md`
  e nesta auditoria), extrair a chave do Keystore/Keychain se o SO/kernel estiver comprometido a
  esse ponto, ou instrumentar o app para contornar a UI do cofre.
- **Isso é um limite conhecido e aceito para o MVP1**, não uma lacuna escondida. Nenhuma
  documentação de loja, política de privacidade ou copy de produto deve prometer proteção contra
  aparelho comprometido — a proteção real oferecida é: dados cifrados em repouso com material que
  nunca sai do aparelho, e nenhuma dependência de rede que amplie a superfície de ataque.
- Se o produto decidir no futuro adicionar detecção de root/jailbreak ou attestation, isso é uma
  mudança de arquitetura que exige decisão explícita do Luiz (novo SDK, possível impacto de
  compatibilidade, falsos positivos em aparelhos legítimos rooteados por escolha do usuário) — **não
  está no escopo desta auditoria nem deve ser implementado como parte da #130**.

## 17. Transferência direta entre dispositivos — não aplicável ao MVP1 atual

- **Não implementado hoje.** Não existe nenhum código de transferência direta (Wi-Fi Direct,
  Bluetooth, QR code, link efêmero) entre um Android e um iOS, ou entre dois aparelhos, no MVP1
  atual. O único caminho de "levar o patrimônio para outro aparelho" é gerar um `*.savrobackup` e
  restaurá-lo manualmente (#121), já coberto na seção 7.
- **Risco futuro, se implementada:** qualquer canal de transferência direta introduziria uma nova
  superfície de rede local (mesmo sem servidor) — pareamento, autenticação do par, e a mesma
  disciplina de criptografia do backup atual precisariam se estender a um canal ao vivo, não só a
  um arquivo estático.
- **Requisito obrigatório antes de criar essa feature:** modelo de ameaça próprio (pareamento,
  MITM em rede local, autenticação mútua), decisão explícita sobre reaproveitar ou não o formato
  `*.savrobackup` como payload, e aprovação do Luiz — feature nova de arquitetura, não decisão que
  esta auditoria toma.

## 18. Notificações — não aplicável ao MVP1 atual

- **Não implementado hoje.** Nenhum código de notificação local ou push existe no MVP1
  (`androidApp`/`iosApp` não declaram `NotificationManagerCompat`/canais nem
  `UNUserNotificationCenter`/categorias — confirmado por grep, zero ocorrências fora de comentários
  da ADR-002). A funcionalidade pertence à issue #128 ("Criar alertas locais"), que é feature
  vinculada ao épico #123 e está com checkbox não marcado (não implementada).
- **Risco futuro, se implementada:** conteúdo de notificação aparece na tela de bloqueio e em
  outros apps de notificação (histórico do sistema) — superfície de vazamento por definição mais
  ampla que a tela do próprio app.
- **Requisito obrigatório antes de criar essa feature:** a ADR-002 já registra a regra ("conteúdo
  sempre redigido, nunca valor real") — a #128, quando executada, precisa (a) provar com teste
  automatizado que nenhuma notificação carrega valor/nome/instituição, (b) decidir o comportamento
  padrão em tela de bloqueio (prévia oculta por padrão), e (c) atualizar a matriz de dados desta
  auditoria antes de liberar.

## 19. Pacotes públicos (catálogo/cotações de mercado) — não aplicável ao MVP1 atual

- **Não implementado hoje.** Pertence às issues #124/#125 (fora de escopo, checkboxes não
  marcados). Não existe `shared:core:network`, cliente HTTP, nem qualquer download de pacote no
  MVP1 atual (confirmado nesta auditoria — ver `auditoria-rede-savro.md`).
- **Risco futuro, se implementada:** é a primeira vez que o app abre qualquer conexão de rede —
  precisa de validação de manifesto/hash de pacote (já previsto na ADR-002), TLS/certificate
  pinning a decidir, e reavaliação completa desta auditoria de rede (a resposta "MVP1 funciona 100%
  sem rede" deixa de ser verdadeira a partir desse ponto).
- **Requisito obrigatório antes de criar essa feature:** o gate `verifyNoNetworkAccess` criado
  nesta issue precisa ser **atualizado deliberadamente** (não removido) para declarar exatamente
  onde a exceção de rede é permitida (só `shared:core:network`, nunca em `shared:domain:patrimonio`
  ou `shared:core:database`) — e a auditoria de rede desta issue precisa ser refeita, não só
  revisada.
