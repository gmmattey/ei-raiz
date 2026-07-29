# Segurança de tela e acessibilidade — Savro (issue #130, máscara unificada na #230)

## Máscara de valores

- `ApresentacaoValor` (`:shared:core:designsystem`, `componentes/ApresentacaoValor.kt`, `internal`):
  função pura, testada (`ApresentacaoValorTest`, 9 casos — visível/oculto, positivo/negativo/zero/
  valor grande, alternância), que troca o texto visível **e** o `contentDescription` de
  acessibilidade por uma máscara fixa (`"••••••"`/`"Valor oculto"`) — nunca passa o valor real para
  nenhum dos dois quando `oculto = true`. Movida de `:shared:domain:patrimonio` para
  `:shared:core:designsystem` na #230: é uma função de apresentação, não de domínio patrimonial, e
  precisa estar no mesmo módulo que o componente Compose que a consome (a allowlist de
  `aplicativo/build.gradle.kts` só permite `designsystem → core:common`, não
  `designsystem → domain:patrimonio`). `internal`: nenhuma tela pode mais chamá-la diretamente —
  só `SavroPrivacyMask`/`SavroPrivacyText` a consomem, o que elimina a duplicação estruturalmente
  (erro de compilação, não só convenção de code review).

## Árvore semântica (accessibility tree)

- `SavroPrivacyMask`/`SavroPrivacyText` (`:shared:core:designsystem`,
  `componentes/SavroComponents.kt`): **único** ponto de verdade para ocultação de valores
  patrimoniais na UI (issue #230). `SavroPrivacyMask` cobre o padrão rótulo/valor em duas colunas
  (Home, Detalhe); `SavroPrivacyText` cobre texto composto numa linha só (cartão de item da lista
  de Patrimônio). Nenhuma tela compõe o valor real quando oculto — `texto`/`descricao` já chegam
  mascarados de `ApresentacaoValor` antes de entrar na árvore de Compose.
- Testado nas duas plataformas a partir de uma única implementação em `commonTest`:
  `SavroPrivacyMaskCommonTest`, `SavroPrivacyTextCommonTest` e `ApresentacaoValorTest` (rodam via
  `androidUnitTest`/Robolectric neste ambiente e via `iosTest`/XCTest em host macOS), mais
  `SavroPrivacyMaskInstrumentedTest` (`androidInstrumentedTest`, Compose UI Test real, cobre as
  duas variantes). Todos confirmam via `onNodeWithText(...)`/`onNodeWithContentDescription(...)`
  que nem o texto visível nem o `contentDescription` contêm o valor real quando oculto, e que
  alternar oculto→visível→oculto (recomposição) nunca vaza o valor no meio do caminho.
- **Achado da auditoria #130, resolvido nesta issue:** antes da #230, `SavroPrivacyMask` existia e
  era testado, mas não tinha nenhum consumidor em produção — `HomeScreens.kt`/`DetalheScreens.kt`/
  `PatrimonioScreens.kt` reimplementavam a mesma lógica localmente (`ApresentacaoValor` do domínio +
  `Modifier.semantics { contentDescription = ... }` manual em cada tela), três vezes. As três telas
  agora chamam `SavroPrivacyMask`/`SavroPrivacyText`; as implementações locais (`LinhaValor`,
  `LinhaComOculto`, o bloco manual em `ItemPatrimonialCard`) foram removidas.

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
