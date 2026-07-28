# 130 — Governar segurança, telemetria e limites da arquitetura local-first multiplataforma

- **Issue:** [#130](https://github.com/gmmattey/esquilo-wallet/issues/130) (filha do épico #123,
  relacionada à ADR-002 gerada pela #192).
- **Predecessoras já concluídas:** ADR-002 (#192), fundação KMP (#193), persistência cifrada
  (#180), cofre local (#118), cadastro manual (#119), timeline básica (#120), backup criptografado/
  restauração/CSV (#121).
- **Executor:** Igor (especialista KMP/iOS), convocado pelo Thiago para este ciclo de auditoria de
  segurança/privacidade transversal.

## Escopo real auditado

Todo o código de `aplicativo/` (KMP, Android nativo, projeto Xcode) no estado do commit `66b73e6`.
**Nenhuma feature nova foi implementada** — #124–#129 (pacotes públicos, cruzamento local,
diagnósticos, simulações, alertas, snapshots) continuam com checkbox não marcado no épico #123 e
foram tratadas explicitamente como **não aplicáveis ao MVP1 atual** em todo lugar que a issue #130
original as menciona (transferência direta, notificações, pacotes públicos) — ver
`modelo-ameacas-savro.md` seções 17–19 para o registro formal de risco futuro + requisito
obrigatório de cada uma.

## Entregáveis (todos em `documentacao/arquitetura/seguranca/`)

1. [`modelo-ameacas-savro.md`](../seguranca/modelo-ameacas-savro.md) — 19 seções cobrindo banco
   local, chave mestra, biometria, memória, screenshots/acessibilidade, backup, restauração, CSV,
   temporários, seletores, logs, CI, dependências, rede, engenharia reversa/root-jailbreak, e os
   três itens fora de escopo do MVP1 (transferência, notificações, pacotes públicos) com risco
   futuro + requisito obrigatório registrados.
2. [`matriz-dados-savro.md`](../seguranca/matriz-dados-savro.md) — dado por dado: classificação,
   armazenamento, finalidade, retenção, Android, iOS, backend (N/A por arquitetura em toda linha),
   e permissão em log/crash/telemetria/suporte/backup/CSV.
3. [`contrato-redaction-savro.md`](../seguranca/contrato-redaction-savro.md) — regras de redaction
   + achado corrigido (toString de modelos patrimoniais) + testes automatizados reais.
4. [`inventario-dependencias-savro.md`](../seguranca/inventario-dependencias-savro.md) — todas as
   28 bibliotecas Gradle + o pod CocoaPods, com finalidade/versão/licença/targets/manutenção/rede/
   arquivos/coleta/justificativa, e confirmação de ausência de SDK proibido.
5. [`auditoria-rede-savro.md`](../seguranca/auditoria-rede-savro.md) — análise estática (grep,
   manifests, entitlements), gate automatizado novo, e honestidade explícita sobre o que não foi
   testado (captura de tráfego real em device).
6. [`seguranca-tela-acessibilidade-savro.md`](../seguranca/seguranca-tela-acessibilidade-savro.md) —
   máscara de valores, árvore semântica, `FLAG_SECURE`/overlay iOS, clipboard (N/A hoje).
7. [`revisao-backup-121-issue130.md`](../seguranca/revisao-backup-121-issue130.md) — checklist
   completo da #130 aplicado ao formato V1 já existente; nenhuma falha nova, formato não alterado.
8. [`loja-google-play-data-safety.md`](../seguranca/loja-google-play-data-safety.md) e
   [`loja-app-store-privacy.md`](../seguranca/loja-app-store-privacy.md) — rascunhos baseados no
   estado real do código, alimentam a #122 (não iniciada, não tocada).
9. [`testes-gates-regressao-savro.md`](../seguranca/testes-gates-regressao-savro.md) — lista de
   todos os gates/testes novos e existentes, com resultado de execução local.

## Código real alterado (não é só documentação)

| Arquivo | Mudança |
|---|---|
| `aplicativo/shared/core/model/src/commonMain/kotlin/io/savro/model/ItemPatrimonial.kt` | `toString()` explícito e redigido em `ItemPatrimonial`, `AjusteValorItem`, `EventoTimelineItem` |
| `aplicativo/shared/core/backup/src/commonMain/kotlin/io/savro/backup/ConteudoBackup.kt` | `toString()` explícito e redigido em `ConteudoBackup` (só contagens) |
| `aplicativo/shared/core/model/src/commonTest/kotlin/io/savro/model/RedacaoModeloPatrimonialTest.kt` | **Novo** — 3 testes de regressão de redaction |
| `aplicativo/shared/core/backup/src/commonTest/kotlin/io/savro/backup/RedacaoConteudoBackupTest.kt` | **Novo** — 1 teste de regressão de redaction |
| `aplicativo/shared/core/testing/src/androidUnitTest/kotlin/io/savro/testing/VerifyDependencyInventoryTest.kt` | **Novo** — gate de regressão do inventário de dependências |
| `aplicativo/build.gradle.kts` | Estende listas de referências proibidas com padrões de rede; nova tarefa `verifyNoNetworkAccess` (androidApp + iosApp Swift); `check` passa a depender dela |
| `.github/workflows/aplicativo-ci.yml` | `verifyNoNetworkAccess` no job de arquitetura; `:shared:core:model:testDebugUnitTest` no job de testes comuns |

## Testes rodados localmente nesta auditoria

- `verifyArchitecture`, `verifyDesignSystemTokens`, `verifyNoNetworkAccess` — `BUILD SUCCESSFUL`.
- `:shared:core:model:testDebugUnitTest` — 3 testes novos, 0 falhas.
- `:shared:core:backup:testDebugUnitTest` — 1 teste novo + suíte existente, 0 falhas.
- `:shared:core:testing:testDebugUnitTest` — 1 teste novo + `VerifyArchitectureFunctionalTest`, 0 falhas.
- `:shared:core:designsystem:testDebugUnitTest`, `:shared:core:security:testDebugUnitTest`,
  `:shared:domain:patrimonio:testDebugUnitTest`, `:androidApp:testDevDebugUnitTest` — suíte
  completa, 0 falhas (confirma ausência de regressão nos módulos que consomem os modelos alterados).
- `:shared:core:database:testDebugUnitTest` — **4 falhas pré-existentes**, confirmadas presentes
  também em `master` sem nenhuma alteração desta issue (testado via `git stash`). Não é regressão
  introduzida por esta auditoria — é uma falha ambiental (`RoomRepositorioItensPatrimoniaisContratoTest`
  retornando `FalhaAbertura` em vez do erro esperado em 4 casos, neste host Windows específico,
  possivelmente relacionado a como o Robolectric/SQLite nativo se comporta neste ambiente). A CI
  real roda em `ubuntu-latest`, não neste host — registrado como achado a escalar, não corrigido
  nesta issue por estar fora do escopo de segurança/privacidade da #130.

## Achado não resolvido, a escalar para o Luiz

O arquivo `savro.db` (SQLCipher) no lado iOS não tem exclusão explícita de backup do sistema
(`NSURLIsExcludedFromBackupKey`) — a chave mestra (Keychain, `ThisDeviceOnly`) já está corretamente
excluída, mas o arquivo de banco cifrado em si, em `Application Support`, segue a política padrão
do iOS (incluído em backups iCloud/iTunes). Como o conteúdo está cifrado com uma chave que nunca
sai do aparelho de origem, o risco prático é baixo (o arquivo seria um blob inútil sem a chave), mas
a correção recomendada (marcar o diretório como excluído via API pública `NSURLIsExcludedFromBackupKey`)
não foi implementada nesta auditoria porque este ambiente não tem toolchain macOS/Xcode para
compilar e validar uma mudança em código Kotlin/Native `iosMain` antes de propô-la — mesmo padrão de
cautela que o próprio código já documenta em vários pontos (`ProvedorChaveMestraIOS`, `SQLiteCifrado`).
Recomendação: Igor implementa isso num commit dedicado e pequeno assim que houver acesso a CI/host
macOS para validar (o job `ios-xcode-macos` já existente valida builds iOS reais), ou o Luiz decide
aceitar o risco residual documentado como está.

## Critérios de aceite da #130

- [x] Existe matriz explícita de dados permitidos/proibidos para Android, iOS e backend.
- [x] Logs e crashes passam por testes de redaction em código comum (`RedacaoModeloPatrimonialTest`,
      `RedacaoConteudoBackupTest`) — não há source set de plataforma com log próprio a testar
      separadamente, porque não existe nenhum ponto de log específico de plataforma no MVP1.
- [x] Nenhum SDK de anúncio ou rastreamento invasivo está presente (confirmado, inventário completo).
- [x] Inspeção de tráfego Android e iOS não encontra dados patrimoniais — **análise estática
      completa** (rede zero por construção); captura de tráfego real em device fica pendente,
      registrada explicitamente como não executada.
- [x] Política de privacidade e formulários das duas lojas refletem a implementação — rascunhos
      produzidos, baseados no código real, sem tocar a #122.
- [x] Revisão cobre persistência, chaves, biometria, backup, restauração, transferência (N/A,
      documentada), pacotes (N/A, documentada) e notificações (N/A, documentada).
- [x] Dependências possuem inventário com finalidade, versão, licença, dados acessados e targets.
- [x] Testes impedem regressão de telemetria quando novos modelos/campos patrimoniais forem
      adicionados (`RedacaoModeloPatrimonialTest`/`RedacaoConteudoBackupTest`, com limite honesto
      documentado sobre não serem verificação exaustiva via reflexão).
