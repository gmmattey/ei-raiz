# Segurança de tela e acessibilidade — Savro (issue #130)

## Máscara de valores

- `ApresentacaoValor` (`:shared:domain:patrimonio`, `calculo/ApresentacaoValor.kt`): função pura,
  testada (`ApresentacaoValorTest`, 4 casos), que troca o texto visível **e** o
  `contentDescription` de acessibilidade por uma máscara fixa (`"••••••"`/`"Valor oculto"`) — nunca
  passa o valor real para nenhum dos dois quando `oculto = true`.
- Wired em produção: `HomeScreens.kt` (`ocultarValores`/`aoAlternarOcultarValores`, ícone
  `SavroIcon.OcultarValores`/`MostrarValores` no header da Home) — é a única tela do MVP1 com toggle
  de ocultar valores hoje (`PatrimonioScreens.kt`/`DetalheScreens.kt` foram inspecionados nesta
  auditoria; a função de máscara está disponível para eles, mas não foi confirmado uso do toggle
  nessas duas telas especificamente — registrado como item a confirmar, não como falha, já que a
  Home é o ponto central de consolidação onde o requisito original da issue #120 mais se aplica).

## Árvore semântica (accessibility tree)

- `SavroPrivacyMask` (`:shared:core:designsystem`, `componentes/SavroComponents.kt`): componente
  Compose Multiplatform que **remove completamente** o conteúdo sensível da árvore de semântica
  quando `isVisible = false` (renderiza só um `Surface` com o texto do rótulo oculto — o `content`
  sensível não é composto de jeito nenhum nesse ramo do `if`).
- Testado nas duas plataformas a partir de uma única implementação:
  `SavroPrivacyMaskCommonTest` (`commonTest`, roda via `androidUnitTest`/Robolectric neste ambiente
  e via `iosTest`/XCTest em host macOS) e `SavroPrivacyMaskInstrumentedTest`
  (`androidInstrumentedTest`, Compose UI Test real). Ambos confirmam via
  `onNodeWithText(...).assertDoesNotExist()` que o valor real não está na árvore quando oculto.
- **Achado "importante" desta auditoria:** `SavroPrivacyMask` existe e é testado, mas as telas de
  produto (`HomeScreens.kt`) implementam a ocultação **diretamente com `ApresentacaoValor` +
  `Modifier.semantics { contentDescription = ... }`**, não usando o componente `SavroPrivacyMask`.
  As duas abordagens são equivalentes em efeito (nenhuma vaza o valor real — confirmado por leitura
  de código e pelos testes de cada uma), mas são dois caminhos paralelos para o mesmo problema, o
  que é uma duplicação de lógica, não uma falha de segurança. Recomendação registrada para uma
  issue futura de design system: convergir `HomeScreens`/`PatrimonioScreens`/`DetalheScreens` para
  usar `SavroPrivacyMask` como único ponto de verdade, ou depreciar `SavroPrivacyMask` se a decisão
  for manter `ApresentacaoValor` como a abordagem canônica. Não corrigido nesta issue por ser
  refatoração de UI fora do escopo de segurança/privacidade puro da #130 — nenhuma das duas
  abordagens vaza dado hoje.

## Recent apps / app switcher e screenshots

- **Android:** `FLAG_SECURE` aplicado em `MainActivity.onCreate` (`window.setFlags(FLAG_SECURE,
  FLAG_SECURE)`) — bloqueia screenshot, gravação de tela e miniatura no Recents para a Activity
  inteira. Testado por `MainActivitySnapshotProtectionTest` (Robolectric), rodado nesta auditoria
  como parte da suíte `:androidApp:testDevDebugUnitTest` (sucesso).
- **Decisão de escopo, não ativação cega:** `FLAG_SECURE` é aplicado à `Activity` inteira (única
  Activity do app), não a uma tela específica — decisão correta para um app cujo conteúdo principal
  é 100% patrimonial (não há, por exemplo, uma tela de "sobre o app" ou "termos de uso" que
  justificasse permitir screenshot seletivamente). Risco residual: nenhuma tela do Savro pode ser
  capturada em print pelo próprio usuário para compartilhar suporte/feedback — é uma limitação de
  UX aceita pela decisão de segurança, não um bug.
- **iOS:** `SnapshotProtectionOverlay` (`ContentView.swift`) cobre a `ComposeView` com um blur
  (`UIVisualEffectView`, `.systemMaterialDark`) sempre que `scenePhase != .active`
  (`iOSApp.swift`) — cobre a miniatura do app switcher e a transição para background. **Risco
  residual documentado, não escondido:** não existe equivalente iOS ao `FLAG_SECURE` que bloqueie
  print manual (`Screenshot` físico) com o app em primeiro plano ativo — é limitação de plataforma
  (Apple não expõe essa API para apps de terceiros), não falha de implementação. Sem teste
  automatizado (comportamento ligado a `scenePhase` de UI nativa SwiftUI, não capturado por
  `commonTest`/XCTest sem simulador rodando app real) — validado apenas por leitura de código nesta
  auditoria.

## Clipboard

Nenhuma funcionalidade de copiar valor para a área de transferência existe no MVP1 (grep por
`Clipboard`/`UIPasteboard` em toda a árvore: zero ocorrências). Não é uma ameaça ativa hoje. Se uma
feature de "copiar valor" for adicionada no futuro, ela precisa (a) decidir se o valor cifrado
alcança o clipboard do sistema mesmo com a máscara de privacidade ativa (recomendação: nunca
permitir copiar um valor que está com a máscara ativa na tela) e (b) considerar o timeout de
limpeza automática do clipboard que iOS 16+/Android 13+ já oferecem nativamente.

## Mensagens de erro

Cobertas em detalhe em `contrato-redaction-savro.md`. Resumo: `ErroBackup`/`ErroRepositorio` usam
rótulos técnicos fixos, nunca interpolam dado patrimonial, senha ou chave.

## Notificações

Não aplicável ao MVP1 atual — ver `modelo-ameacas-savro.md` seção 18.

## Compartilhamento de CSV/backup

Cobre os seletores nativos do sistema (SAF/`UIDocumentPickerViewController`) — ver
`modelo-ameacas-savro.md` seções 9 e 11. O app não controla o que acontece com o arquivo depois que
o usuário o entrega a outro app via esses seletores; isso é o comportamento pretendido (o usuário
decide o destino).

## Resumo da decisão de `FLAG_SECURE`/equivalente iOS

| Plataforma | Mecanismo | Escopo | Decisão | Risco residual |
|---|---|---|---|---|
| Android | `FLAG_SECURE` | App inteiro (única Activity) | Ativado, sem exceção | Nenhum print/gravação de tela possível em nenhuma tela do app, inclusive para o próprio usuário |
| iOS | `SnapshotProtectionOverlay` (blur) | Background/app switcher apenas | Ativado para as transições cobertas pela API disponível | Print manual em primeiro plano ativo não é bloqueável — limite de plataforma, não de implementação |
