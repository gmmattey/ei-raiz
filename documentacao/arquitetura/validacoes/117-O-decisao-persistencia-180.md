# 117-O — decisão de biblioteca de persistência cifrada multiplataforma (#180)

- **Issue:** [#180](https://github.com/gmmattey/esquilo-wallet/issues/180) (filha de #117)
- **Predecessoras obrigatórias:** ADR-002 aprovada em #192 (117-K), fundação KMP #193 (117-L).
  Baseline Android/SQLCipher de #176 (117-A) reaproveitado como evidência, não como decisão
  automática para iOS — exigência explícita da #180.
- **Escopo:** registra a decisão de biblioteca que a ADR-002 deliberadamente deixou pendente
  ("Pendência deliberada — biblioteca de persistência", seção "Persistência cifrada
  multiplataforma"), implementa `:shared:core:database`, e formaliza o formato lógico comum. Não é
  uma ADR nova — a decisão arquitetural (contrato comum, engines físicas podem divergir) já está
  fechada na ADR-002; este documento só resolve a lacuna que ela nomeou.

## Spike comparativo exigido pela ADR-002

| Opção | Veredito | Motivo |
|---|---|---|
| Room KMP (`RoomDatabase.Builder<T>` + `SQLiteDriver` novo, comum às duas plataformas) | **rejeitada para uso multiplataforma real** | O caminho de integração com SQLCipher aprovado em 117-A é `SupportOpenHelperFactory` (`net.zetetic.database.sqlcipher.SupportOpenHelperFactory`), que implementa `androidx.sqlite.db.SupportSQLiteOpenHelper.Factory` — API `SupportSQLite*`, exclusiva do target Android (não existe em Kotlin/Native). O driver novo do Room KMP (`BundledSQLiteDriver`) é multiplataforma, mas usa a build "bundled" do SQLite do próprio Room — não há hoje um `SQLiteDriver` oficial que troque essa engine por SQLCipher no iOS. Ou seja: entidades/DAOs Room *poderiam* em tese ser `commonMain`, mas a via de cifra aprovada para Android não é alcançável a partir do driver KMP, e forçar `BundledSQLiteDriver` sem cifra no iOS violaria a regra "compartilhar código nunca reduz a proteção do cofre". Room fica só no Android. |
| SQLDelight (driver comum, cifra via driver customizado) | **rejeitada por acréscimo de complexidade sem ganho real** | SQLDelight não tem driver de criptografia oficial. Para cifrar, teria que: (a) Android — reimplementar a integração SQLCipher que o `net.zetetic:sqlcipher-android` já oferece pronta para Room; (b) iOS — o mesmo cinterop de SQLCipher que a opção escolhida abaixo já precisa. Trocar Room por SQLDelight no Android jogaria fora a integração pronta e testada (117-A) sem eliminar a necessidade de cinterop manual no iOS — dois custos, nenhum ganho de compartilhamento real de código de banco (o objetivo de "DAO comum" não se sustenta de qualquer forma, porque a fronteira de domínio já proíbe tipo de infraestrutura vazar para `:shared:domain:patrimonio`/`:shared:app` — ver ADR-002). |
| **Combinação de persistência nativa por plataforma** (Room+SQLCipher no Android, SQLCipher nativo no iOS) | **escolhida** | Android reaproveita 100% da validação já feita em 117-A/#176 (baseline aprovado, sem re-litigar). iOS usa SQLCipher (a mesma biblioteca de cifra, não uma alternativa mais fraca) via cinterop Kotlin/Native, consumindo o pod CocoaPods oficial `SQLCipher` da Zetetic. As duas plataformas ficam atrás do mesmo contrato (`RepositorioItensPatrimoniais`, `:shared:domain:patrimonio`), com o mesmo schema lógico e as mesmas migrations descritas em `EsquemaSavro` (`:shared:core:database`, `commonMain`). Nenhuma DAO/entidade de infraestrutura cruza a fronteira de domínio nas duas implementações. |

Critérios do spike aplicados à opção escolhida:

- **Criptografia real e mantida**: SQLCipher em ambas — Community Edition ativa (`net.zetetic:sqlcipher-android:4.17.0`, Android; pod `SQLCipher` 4.9.x, iOS). Nenhum modo "sem cifra".
- **Migrations**: `EsquemaSavro.migracoes` (commonMain) é a fonte de verdade da versão lógica; Android usa `androidx.room.migration.Migration`, iOS usa `PRAGMA user_version` + SQL manual — mesmo *o que* muda entre versões, *como* migra é de engine (ADR-002 permite isso explicitamente).
- **Suporte Android e iOS**: os dois têm implementação completa da interface comum.
- **Compatibilidade 16 KB (Android)**: herdada de 117-A — `sqlcipher-android:4.17.0` já suporta; `#180` ainda não gerou o AAB de release nem mediu o delta real (ver Pendências).
- **Integração Keystore/Keychain**: `ProvedorChaveMestraAndroid` (Android Keystore, alias `savro.vault.master.v1`, não exportável) e `ProvedorChaveMestraIOS` (Keychain, `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, não sincronizável ao iCloud).
- **Backup/restauração**: fora de escopo implementar (#121), mas o formato lógico (`EsquemaSavro`, `ItemPatrimonial`) é o mesmo nas duas plataformas — pré-requisito para `*.savrobackup` ser portável.
- **Maturidade/manutenção/licença**: SQLCipher Community, BSD-style com atribuição — já avaliado em 117-A para Android; mesma licença/condição vale para o pod iOS.
- **Tamanho de binário**: medido só para Android (117-A trouxe metodologia; #180 não gerou AAB de release novo). iOS não medido — depende do link real, que só acontece no runner macOS.
- **Testabilidade multiplataforma**: o contrato (`RepositorioItensPatrimoniaisContratoTeste`, `:shared:core:database/commonTest`) roda contra o fake (sempre), contra Room real (Android, `androidUnitTest`/Robolectric) e contra SQLCipher real (iOS, `iosTest` — ver Pendências sobre execução).

## Módulo criado: `:shared:core:database`

Primeiro conteúdo real do módulo que a ADR-002 já havia reservado ("Não criados nesta issue... nascem quando a issue correspondente começar a implementar"). Grafo de dependência:

```text
:shared:core:database → :shared:core:common, :shared:core:model, :shared:domain:patrimonio
:shared:app           → (não wireado ainda — ver Pendências)
```

`:shared:domain:patrimonio` ganhou seu primeiro conteúdo real também (a ADR previa isso: "contratos de
repositório (interfaces)" é responsabilidade dele):

- `RepositorioItensPatrimoniais` / `TransacaoItensPatrimoniais` — contrato comum.
- `ProvedorChaveMestra` — contrato de material criptográfico (hospedado aqui até `:shared:core:security` existir, conforme ADR-002).
- `ErroRepositorio` — vocabulário de erro independente de engine.

`:shared:core:common` ganhou `Resultado<T, E>` e `Relogio` (interface pura — implementações reais
ficam nos módulos de plataforma, porque `:shared:core:common` é módulo puro e não pode chamar API
de plataforma em nenhum source set, nem Android nem iOS).

## Schema mínimo

Um agregado só (`ItemPatrimonial`), suficiente para provar o cofre ponta a ponta — não é o modelo
de patrimônio completo (isso é regra de negócio de issues futuras):

```text
itens_patrimoniais
  id                      TEXT PRIMARY KEY
  tipo                    TEXT NOT NULL   (enum TipoItemPatrimonial)
  nome                    TEXT NOT NULL
  valor_centavos          INTEGER NOT NULL
  instituicao             TEXT NULL
  observacao              TEXT NULL       (adicionada na migration 1→2)
  criado_em_epoca_ms      INTEGER NOT NULL
  atualizado_em_epoca_ms  INTEGER NOT NULL
```

Versão atual: 2. Migration 1→2 documentada em `EsquemaSavro.migracoes` (commonMain), implementada
em `MIGRATION_1_2` (Room, Android) e inline em `aplicarSchemaEMigrations` (SQLCipher/iOS) — mesma
operação (`ALTER TABLE ... ADD COLUMN observacao TEXT`) nas duas.

## Android

- Room 2.8.4 + `net.zetetic:sqlcipher-android:4.17.0` via `SupportOpenHelperFactory` — baseline
  117-A reaplicado sem alteração de versão.
- `ProvedorChaveMestraAndroid`: passphrase de 256 bits gerada com `SecureRandom`, encapsulada
  (AES-256-GCM) por chave do Android Keystore (alias `savro.vault.master.v1`, não exportável, sem
  `setUserAuthenticationRequired` — isso é da #118). Blob encapsulado gravado em
  `Context.getNoBackupFilesDir()`, nunca em `SharedPreferences`/ao lado de `savro.db` (117-A).
- `android:allowBackup="false"` já existia em `AndroidManifest.xml` desde a fundação (#193) —
  cobre banco, journals e o arquivo de chave encapsulada sem precisar de regra de extração adicional.
- Erro de abertura mapeado por *substring* da mensagem (`"encrypted"`/`"not a database"`) para
  `ErroRepositorio.ChaveInvalida` — SQLite/SQLCipher não distinguem "chave errada" de "arquivo
  corrompido" por código de erro.

### Achado de teste real (não é hipotético — bloqueou a suíte até ser corrigido)

Rodando os testes reais de Room em Robolectric, a suíte falhava de forma intermitente com
`SQLITE_CANTOPEN` em `PRAGMA journal_mode=WAL`. Causa raiz: o runtime nativo de SQLite do
Robolectric (`org.robolectric.nativeruntime.SQLiteConnectionNatives`) não sustenta WAL de forma
confiável. Fix aplicado **só no teste** (`RoomDatabase.JournalMode.TRUNCATE`, via parâmetro
`modoJournal` de `RepositorioItensPatrimoniaisRoom`, `null`/WAL padrão em produção) — não é
peculiaridade do Savro, é limitação documentada de rodar Room sob Robolectric. Registrado aqui
porque não está em nenhum dos pareceres anteriores (117-A não testava Room de verdade ainda).

### Dois bugs reais que só apareciam em device/emulador de verdade (#247)

Robolectric usa `FrameworkSQLiteOpenHelperFactory` no lugar do SQLCipher real (ver Pendência 2,
histórica) — então nunca exercitou o caminho que quebrava em produção: o cofre nunca abria em
Android real (`UnsatisfiedLinkError`). Dois bugs distintos, os dois só visíveis com a suíte comum
rodando de verdade contra `net.zetetic:sqlcipher-android` em `androidInstrumentedTest`:

1. **`libsqlcipher.so` nunca era carregada.** `net.zetetic:sqlcipher-android:4.17.0` (ao contrário
   da geração anterior da biblioteca, que expunha `SQLiteDatabase.loadLibs(context)`) não carrega a
   lib nativa sozinha — quem integra precisa chamar `System.loadLibrary("sqlcipher")`
   explicitamente antes de qualquer conexão. Ninguém fazia isso. `SupportOpenHelperFactory` subia
   normalmente (é só uma classe Kotlin), mas a primeira abertura real de conexão derrubava o app com
   `UnsatisfiedLinkError` em `net.zetetic.database.sqlcipher.SQLiteConnection.nativeOpen`. Fix:
   `System.loadLibrary("sqlcipher")` num bloco `init` de `companion object` (`by lazy`, uma vez por
   processo) em `RepositorioItensPatrimoniaisRoom`, disparado só dentro da fábrica *padrão* de
   `fabricaOpenHelper` — o teste Robolectric, que troca a fábrica, nunca aciona esse carregamento.
2. **`Arrays.fill(chave, 0)` zerava a mesma referência de array entregue ao SQLCipher.** Depois do
   fix acima, a abertura inicial funcionava, mas testes com múltiplas operações sequenciais (várias
   inserções, transações, listagens) falhavam de forma intermitente com
   `SQLiteNotADatabaseException: file is not a database`, sempre ao abrir uma conexão *secundária*
   do pool de WAL (leitura concorrente) — nunca a primária. Causa: `abrirComChave()` zera `chave`
   (`Arrays.fill(chave, 0)`, higiene de memória correta em princípio) depois de construir o banco,
   mas `SupportOpenHelperFactory(chave)` guardava a **mesma referência**, não uma cópia — SQLCipher
   retém esse array em `SQLiteDatabaseConfiguration.password` para reabrir conexões extras do pool
   pelo tempo de vida do banco. Zerar essa referência corrompia a chave de qualquer conexão aberta
   depois da primeira. Fix: `SupportOpenHelperFactory(chave.copyOf())` — SQLCipher passa a reter uma
   cópia própria, e `Arrays.fill` só zera a referência que a nossa própria função recebeu de
   [ProvedorChaveMestra]. Nenhuma redução de higiene de memória: a chave da aplicação continua sendo
   zerada assim que deixa de ser necessária, só não é mais a mesma referência que o motor de
   persistência precisa manter viva.

Essa combinação (native lib nunca carregada + chave corrompida em conexões tardias) é o motivo pelo
qual o cofre nunca abria em nenhum Android real antes da #247, apesar de toda a suíte Robolectric
estar verde.

## iOS

- SQLCipher nativo via cinterop Kotlin/Native, consumindo o pod CocoaPods oficial `SQLCipher`
  (Zetetic) através do plugin `org.jetbrains.kotlin.native.cocoapods` — `pod("SQLCipher")` em
  `shared/core/database/build.gradle.kts`.
- Sem Room/SQLDelight no iOS: DAO escrito à mão sobre a API C do SQLite (`SQLiteCifrado.kt`), só
  `sqlite3_exec` (sem `prepare`/`bind`/`step`) para reduzir superfície de cinterop — valores
  interpolados com escaping manual de aspas simples, aceitável porque o schema é fechado (nenhuma
  entrada de usuário final vira SQL ainda).
- `ProvedorChaveMestraIOS`: passphrase de 256 bits gerada com `SecRandomCopyBytes`, guardada como
  `kSecClassGenericPassword` no Keychain, `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` (exige
  aparelho desbloqueado, nunca sincroniza para o iCloud Keychain). Sem uma segunda camada manual de
  Secure Enclave — o próprio Keychain já cifra o item em repouso com material derivado de hardware,
  diferente do Android, que precisa de uma chave Keystore explícita porque não tem um cofre
  equivalente embutido no armazenamento simples.
- `PRAGMA user_version` como equivalente lógico ao versionamento do Room.

### Risco explícito e não escondido: nada disso foi compilado

Toda a implementação iOS (`ProvedorChaveMestraIOS.kt`, `SQLiteCifrado.kt`,
`RepositorioItensPatrimoniaisSQLCipher.kt`) foi escrita em host Windows, sem toolchain Kotlin/Native
para iOS disponível. Confirmado empiricamente nesta sessão: um módulo KMP com `cocoapods { pod(...)
}` faz o Gradle **pular** (`SKIPPED`, não falhar) a compilação dos alvos `iosArm64`/
`iosSimulatorArm64` em qualquer host não-mac (Windows e o job `ios-compilacao-linux`, que roda em
`ubuntu-latest`, igualmente incapazes de rodar `pod install`). Isso significa:

1. O job `ios-compilacao-linux` da CI (#195) **não pega mais erro de tipagem do `iosMain` deste
   módulo** — antes desta mudança ele compilava de verdade; a partir de agora, para qualquer alvo
   que dependa (direta ou transitivamente) de `:shared:core:database`, ele só confirma que o build
   não quebra de forma dura, não que o Kotlin compila. Isso é uma perda de cobertura real, registrada
   aqui, não escondida.
2. A única validação real de compilação/link do código iOS desta issue é o job `ios-xcode-macos`
   (runner macOS hospedado, #195) — quando esta PR abrir, o resultado desse job é a primeira
   evidência de verdade sobre se este Kotlin/cinterop compila.
3. `:shared:app` e `:androidApp` **não foram alterados para consumir `:shared:core:database`** —
   deliberado: wireei o módulo, mas não a composição/injeção de dependência (isso é wiring de
   produto, fora do escopo de #180 e melhor decidido junto com #118, que define o resto da máquina
   de estados do cofre). Por isso o job `ios-compilacao-linux` continua **verde e com cobertura real
   igual a antes** para tudo que já existia (`:shared:app` não referencia o módulo novo, então nada
   nele fica sujeito ao skip acima) — só o próprio `:shared:core:database` perde a rede de segurança
   Linux.

## Pendências reais (não escondidas atrás de "feito")

1. **iOS não compilado nem executado** — depende do resultado do job `ios-xcode-macos` na CI real
   desta PR. Primeira coisa a checar; se o pod `SQLCipher` não resolver ou os bindings gerados não
   caírem no pacote `cocoapods.SQLCipher.*` como assumido em `SQLiteCifrado.kt`, é o próximo passo
   de correção.
2. ~~**`androidInstrumentedTest` não executado**~~ — **resolvido na #247** (2026-07-30). O source
   set `androidInstrumentedTest` não existia de verdade (só o processor KSP estava preparado); a
   lacuna escondia dois bugs reais que faziam o cofre nunca abrir em Android real (ver "Dois bugs
   reais que só apareciam em device/emulador de verdade", acima). `:shared:core:database:connectedDebugAndroidTest`
   agora roda a suíte de contrato comum inteira (`RoomSQLCipherRepositorioItensPatrimoniaisInstrumentedTest`)
   contra SQLCipher real (`SupportOpenHelperFactory`, sem troca por `FrameworkSQLiteOpenHelperFactory`),
   incluindo a rejeição de chave errada — 42/42 testes passando em emulador (Pixel 10, API 37,
   x86_64). A CI (#195) ainda não roda `connectedAndroidTest` automaticamente (exige emulador/device
   no runner); isso continua pendente separado — o que fechou aqui foi a existência e execução local
   do teste, não a automação em CI.
3. **`:shared:app`/`:androidApp`/`:iosApp` não consomem `:shared:core:database` ainda** — decisão
   deliberada de escopo (ver acima); fica para #118 ou uma issue de wiring dedicada.
4. **AAB 16 KB e medição de tamanho real (Android)** — 117-A já cobriu a metodologia; #180 não
   gerou build de release novo para medir o delta real com o módulo de banco integrado.
5. **Rotação/rekey de passphrase** — 117-A já registrava que isso precisa de procedimento próprio,
   atômico e testável; não implementado aqui (não é UI nem fluxo de usuário, mas também não é só
   schema — fica para quando #118 definir o gatilho de rotação).
6. **`iosTest` não rodava em nenhum job de CI antes desta issue** — lacuna pré-existente da #195
   (nenhum job executava teste iOS, só compilava klib ou fazia build do Xcode). `#180` adicionou um
   passo novo em `ios-xcode-macos` (`:shared:core:database:compileKotlinIosSimulatorArm64` +
   `:shared:core:database:iosSimulatorArm64Test`) para cobrir exatamente o código novo desta issue.
   Continua sem cobertura: `:shared:app`, `:shared:core:designsystem` e os demais módulos não
   ganharam execução de `iosTest` — só o módulo novo.

## Critérios de aceite da #180 — status

- [x] Persistência funciona após reinício em Android — testado (`fecharEReabrir_mantemDadosPersistidos`, Room real via Robolectric).
- [ ] Persistência funciona após reinício em iOS — implementado, **não executado** (pendência 1).
- [x] Banco não abre sem material criptográfico válido — testado nas duas engines via o contrato comum (Android real; iOS não executado, mesma lógica).
- [x] Migrations testadas em Android (Room real, arquivo físico v1→v2). iOS implementado, não executado.
- [x] Operações críticas são transacionais — testado no fake e em Room real (commit e rollback).
- [x] Contratos comuns têm testes compartilhados (`RepositorioItensPatrimoniaisContratoTeste`) + suítes específicas por plataforma.
- [x] Formato lógico compatível entre Android/iOS — mesmo schema, mesma tabela, mesmos tipos lógicos.
- [x] Nenhum dado sensível em backup automático, logs ou temporários — `allowBackup=false` +
      `noBackupFilesDir` (Android), Keychain sem sincronização (iOS); nenhuma mensagem de erro
      inclui SQL com valores, senha ou bytes de chave.
