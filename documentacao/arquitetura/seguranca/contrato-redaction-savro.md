# Contrato de redaction — Savro (issue #130)

Regras aplicadas a logs `commonMain`, Logcat Android, `NSLog`/`print` iOS, exceções, mensagens de
erro, banco, backup/restauração, seletores de arquivo e relatórios técnicos existentes.

## Estado real encontrado nesta auditoria

Grep em toda a árvore `aplicativo/` (exclusive `build/`) por `Log\.|println|NSLog|print\(|
System\.out|Timber|Firebase|Crashlytics|Sentry|Bugsnag`: **zero ocorrências**. O MVP1 não tem
nenhum ponto de logging ativo hoje — nem Logcat, nem `NSLog`, nem crash reporter, nem SDK de
observabilidade. Isso significa duas coisas ao mesmo tempo:

1. **Não há exploração ativa hoje** de nenhum vazamento de log — não existe log.
2. **A superfície real de risco é estrutural, não operacional**: qualquer `Log.d`/`println`/`NSLog`
   escrito no futuro, sobre qualquer objeto de domínio, usaria por padrão o `toString()` gerado
   automaticamente pelas `data class` Kotlin — que inclui **todos** os campos, sensíveis ou não.
   Confiar em "ninguém chama `toString()` de propósito" não é uma mitigação; é uma promessa que
   qualquer PR futuro pode quebrar sem querer.

## Achado corrigido nesta auditoria

Antes desta issue, `ItemPatrimonial`, `AjusteValorItem`, `EventoTimelineItem` (`:shared:core:model`)
e `ConteudoBackup` (`:shared:core:backup`) eram `data class` sem `toString()` próprio. O
`toString()` implícito do Kotlin interpola literalmente todos os campos — ou seja, `nome`,
`instituicao`, `observacao`, `moeda` e valores monetários apareceriam em texto claro em qualquer
`"$item"`, `Log.d(TAG, item.toString())` ou breadcrumb de crash reporter que alguém escrevesse no
futuro sem pensar em redaction.

**Correção aplicada** (código real, não só documentação):

- `ItemPatrimonial.toString()` → `"ItemPatrimonial(id=$id, tipo=$tipo, origem=$origem, arquivado=$arquivado)"`
  (arquivo `aplicativo/shared/core/model/src/commonMain/kotlin/io/savro/model/ItemPatrimonial.kt`).
- `AjusteValorItem.toString()` → `"AjusteValorItem(id=$id, itemId=$itemId, origem=$origem)"` (mesmo arquivo).
- `EventoTimelineItem.toString()` → `"EventoTimelineItem(id=$id, itemId=$itemId, tipo=$tipo)"` (mesmo arquivo).
- `ConteudoBackup.toString()` → só contagens (`itens=N, ajustes=N, eventos=N`), nunca as listas
  inteiras (arquivo `aplicativo/shared/core/backup/src/commonMain/kotlin/io/savro/backup/ConteudoBackup.kt`).

Esta mudança **não altera** a serialização do backup `*.savrobackup` (que usa `SerializadorBackup`/
`JsonCanonico`, campo a campo, nunca `toString()` — confirmado por leitura de código antes de
alterar) nem nenhuma regra de negócio. É puramente a representação textual de depuração.

## Regras do contrato (daqui para frente)

1. **Nunca interpolar objeto de domínio completo.** Nunca `"$item"`, `"$conteudo"` ou
   `logger.info(item)` em código de produção — sempre um campo específico e não sensível (`item.id`,
   `item.tipo`), ou o próprio `toString()` já redigido (aceitável justamente porque foi desenhado
   para isso).
2. **Nunca `toString()` de modelo patrimonial em log/crash/telemetria como se fosse seguro só
   porque existe.** O `toString()` de `ItemPatrimonial`/`AjusteValorItem`/`EventoTimelineItem`/
   `ConteudoBackup` é seguro por construção (ver acima), mas qualquer modelo **novo** que carregar
   dado patrimonial precisa repetir esse padrão explicitamente — não herda a proteção
   automaticamente.
3. **Nunca logar corpo de backup, CSV, senha ou chave.** Já garantido estruturalmente: a senha do
   usuário nunca é persistida (só existe em memória durante geração/restauração,
   `CriptografiaBackup`/`ServicoBackup`), a chave derivada é zerada após uso
   (`chave.fill(0)`/`Arrays.fill`), e o corpo do backup nunca é serializado para string de log em
   nenhum ponto do código (só para `ByteArray`, entregue direto ao seletor nativo).
4. **Erros ao usuário são úteis sem revelar conteúdo.** `ErroBackup.ArquivoInvalido` (senha errada,
   arquivo adulterado ou truncado, tudo o mesmo erro genérico) e `ErroRepositorio.ChaveInvalida`/
   `FalhaAbertura` (rótulos técnicos fixos como `"abertura"`, `"chave"`, nunca a mensagem crua da
   engine de banco) já seguem essa regra — ver `ServicoBackup.paraErroBackup()` e
   `RepositorioItensPatrimoniaisRoom.mapearExcecaoDeAbertura()`. Confirmado nesta auditoria: nenhum
   desses mapeamentos interpola valor, nome, instituição ou senha.
5. **Falhas de criptografia convergem para erro genérico.** `ErroBackup.ArquivoInvalido` é o mesmo
   erro para senha errada, byte adulterado, corpo truncado e conteúdo inconsistente — de propósito
   (ver `formato-savrobackup.md` §3.3, "transformaria o arquivo em oráculo de senha").
6. **Adapters de plataforma seguem o mesmo contrato.** `AutenticadorBiometricoAndroid`/
   `AutenticadorBiometricoIOS` traduzem erros nativos (`BiometricPrompt.ERROR_*`, `LAError*`) para
   `ResultadoAutenticacao` com mensagens técnicas curtas (ex.: "Biometria bloqueada permanentemente
   pelo sistema") — nunca incluem dado patrimonial, porque a camada de biometria nunca tem acesso a
   dado patrimonial em primeiro lugar (ela só autentica, não lê o cofre).

## Testes automatizados que implementam este contrato (código real, não só regra escrita)

### `RedacaoModeloPatrimonialTest` (`:shared:core:model`, `commonTest`)

Arquivo: `aplicativo/shared/core/model/src/commonTest/kotlin/io/savro/model/RedacaoModeloPatrimonialTest.kt`.

Constrói `ItemPatrimonial`/`AjusteValorItem`/`EventoTimelineItem` com valores-marcador
reconhecíveis (`MARCADOR_NOME_SENSIVEL_XPTO`, valores monetários específicos como `123_456_789L`) e
falha se `.toString()` contiver qualquer um deles. Confirma que o `id` (não sensível) continua
visível. **Rodado localmente nesta auditoria: 3 testes, 0 falhas.**

### `RedacaoConteudoBackupTest` (`:shared:core:backup`, `commonTest`)

Arquivo: `aplicativo/shared/core/backup/src/commonTest/kotlin/io/savro/backup/RedacaoConteudoBackupTest.kt`.

Confirma que `ConteudoBackup.toString()` não reintroduz o vazamento agregando a lista inteira de
itens (ex.: `itens=[ItemPatrimonial(...)]` completo) mesmo que cada item individual já se redija
sozinho. **Rodado localmente nesta auditoria: 1 teste, 0 falhas.**

### Limite honesto destes testes

Isto é uma **amostra fixa de valores-marcador**, não uma verificação exaustiva de todo campo futuro
via reflexão — `commonMain` em Kotlin/Native não tem reflexão completa disponível para inspecionar
automaticamente cada propriedade de uma `data class` em tempo de execução. Quem adicionar um campo
sensível novo a `ItemPatrimonial`/`AjusteValorItem`/`EventoTimelineItem`/`ConteudoBackup` (ou criar
um modelo patrimonial novo) precisa:

1. Decidir explicitamente se o campo entra no `toString()`.
2. Atualizar o `toString()` correspondente se a resposta for "não" (o caso normal para qualquer
   campo com nome, valor, instituição, observação, moeda ou senha).
3. Idealmente, adicionar o campo à lista de marcadores testados em `RedacaoModeloPatrimonialTest`/
   `RedacaoConteudoBackupTest`.

Este limite está documentado explicitamente no Kdoc de cada teste — não é um limite escondido.

## Testes já existentes que também sustentam este contrato (não criados nesta issue, confirmados aqui)

- `ApresentacaoValorTest` (`:shared:core:designsystem`, movido de `:shared:domain:patrimonio` na
  #230 junto com a implementação) — confirma que a máscara de privacidade (`"••••••"`/`"Valor
  oculto"`) nunca contém dígito do valor real, tanto no texto visível quanto no
  `contentDescription` de acessibilidade, em valores positivos, negativos, zero e grandes.
- `SavroPrivacyMaskCommonTest`/`SavroPrivacyTextCommonTest`/`SavroPrivacyMaskInstrumentedTest`
  (`:shared:core:designsystem`) — confirmam que o conteúdo sensível é removido da árvore de
  semântica (não só visualmente oculto) quando `oculto = true`, nas duas variantes canônicas
  (`SavroPrivacyMask`/`SavroPrivacyText`, únicos consumidores de `ApresentacaoValor` desde a #230).
- `InteroperabilidadeBackupTest`/vetores de referência (`:shared:core:backup`) — não testam
  redaction diretamente, mas confirmam que a única serialização de dado patrimonial (o JSON dentro
  do backup cifrado) é determinística e auditável campo a campo, reforçando que não há caminho
  paralelo de serialização que possa vazar em texto claro.

## Gate de regressão adicionado nesta issue

Ver `testes-gates-regressao-savro.md` para a lista completa de gates (redaction, rede, inventário
de dependências). Todos os testes deste contrato passam a rodar em CI a partir desta issue —
`:shared:core:model:testDebugUnitTest` foi adicionado ao job `testes-comuns` de
`.github/workflows/aplicativo-ci.yml` (não estava em nenhum job antes desta auditoria).
