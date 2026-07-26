# 117-J — fundação Compose do design system Savro

- **Issue:** #185, filha de #117.
- **Escopo:** módulo visual `:core:designsystem`; sem telas, navegação, regras patrimoniais, rede ou dados.
- **Referências lidas em modo somente leitura:** `C:\Users\luizg\Downloads\Esquilo Wallet Design System.zip` e `C:\Users\luizg\Downloads\Novo Esquilo.zip`.

## Autoridade e decisões aplicadas

1. A issue #117 define o comportamento e as fronteiras; a #185 só entrega fundação visual.
2. `Novo Esquilo.zip` prevalece em fundo, superfície e gradiente porque contém o protótipo mobile.
3. `Esquilo Wallet Design System.zip` governa tokens e componentes quando não há conflito.
4. O design system 7A Labs é exclusivo da landing e foi excluído do Android.
5. Savro é a identidade técnica do Android. Nenhum logo, monograma, `AppLogo`, asset Esquilo ou asset 7A Labs foi criado. A identidade visual definitiva continua pendente.

## Mapeamento design → Compose

| Token original | Nome Compose | Significado semântico | Consumidores |
|---|---|---|---|
| `#07111F` / background | `ColorScheme.background` | fundo primário escuro | `SavroSurface` |
| `#13213A` / surface | `ColorScheme.surface` | contêiner padrão | `SavroCard`, estados |
| `#192A49` / elevated | `ColorScheme.surfaceVariant` | superfície elevada | componentes futuros via tema |
| `#4772F5` / primary | `SavroPrimitiveColor.Blue500` | cor-base de marca | gradiente e referência visual |
| `#3A5FE0` / pressed | `ColorScheme.primary` | ação principal acessível | `SavroButton`, loading |
| `#5FA8FF` / info | `ColorScheme.secondary` | ação/informação secundária | botão secundário |
| `#F06B7A` / error | `ColorScheme.error` | erro e ação destrutiva | botão destrutivo, campo com erro |
| `#F7F9FC`, `#A3AEC3`, `#7F8AA3` | `onBackground`, `onSurfaceVariant` e primitivos | conteúdo principal e secundário | textos e estados |
| 4–64 | `SavroSpacing` + `SavroPrimitiveSpace` | ritmo espacial | card, previews e consumidores futuros |
| 8/12/16/20/pill | `MaterialTheme.shapes` + `SavroPrimitiveRadius` | formas semânticas | card, botões, campos |
| elevação de card/CTA | `SavroElevations` | profundidade visual | `SavroCard` e futuros flutuantes |
| gradiente `#5B84FF → #4772F5 → #2F55D6` | `SavroGradients.primary` | tratamento de destaque | disponível por tema; não aplicado como decoração de tela |
| Manrope / Inter | `SavroTypography` | títulos/valores e corpo | `MaterialTheme.typography` |

Os primitivos são internos; os componentes usam `MaterialTheme`, `SavroThemeTokens` e parâmetros públicos. `verifyDesignSystemTokens` falha se componentes receberem `Color(...)`, `dp`, `sp`, `RoundedCornerShape`, `FontWeight`, alpha ou duração literal.

## Tipografia e licença

As fontes foram obtidas do repositório oficial [google/fonts](https://github.com/google/fonts), commit `7ff85c87f93ea6cca5f41c69f2e4edcb90240f26`, em 2026-07-26. Ambas são SIL Open Font License 1.1 e as cópias de licença estão no módulo Android.

| Fonte | Arquivo | Origem oficial | SHA-256 | Licença |
|---|---|---|---|---|
| Manrope variável | `res/font/manrope_variable.ttf` | `ofl/manrope/Manrope[wght].ttf` | `D0639BE45D0AF36E798172419D7BD173C4BD4F29E2B76CBB69DB1D11BF8B0A40` | `res/raw/manrope_ofl.txt` |
| Inter variável | `res/font/inter_variable.ttf` | `ofl/inter/Inter[opsz,wght].ttf` | `29160A80FF49DDCAB2C97711247E08B1FAB27A484A329CE8B813D820DC559031` | `res/raw/inter_ofl.txt` |

Nenhuma fonte ou ícone foi copiado dos ZIPs.

## Componentes entregues

- `SavroSurface`, `SavroCard`, `SavroPrivacyMask` e `SavroDivider`;
- botões primário, secundário e destrutivo, incluindo loading e desabilitado;
- `SavroTextField` e `SavroFilterChip`;
- `SavroStatePanel` com estados genéricos loading, vazio, erro, offline e conteúdo oculto;
- tema escuro único, `ColorScheme`, `Typography`, `Shapes` e CompositionLocals de espaçamento, opacidade, elevação e gradiente.

Não há preview de pressionado: o estado transitório de interação não é demonstrável de forma honesta em preview estático. Há previews das variantes realmente suportadas: padrão, desabilitado, erro, loading, vazio/estados e fonte ampliada. Não há tema claro.

`#4772F5` é preservado como primitivo de marca e no gradiente. Como branco sobre ele mede 3,99:1, `ColorScheme.primary` usa `#3A5FE0`, que mede 5,11:1 com o conteúdo branco e satisfaz AA para o rótulo normal de botão. O teste `SavroTokensTest.primaryActionMeetsAaContrastWithPrimaryContent` bloqueia regressão. As sombras não traziam valor numérico verificável nos ZIPs; `SavroPrimitiveElevation` usa a aproximação explícita M3 de 1dp para card e 3dp para superfície flutuante, sem reutilizar raios como elevação.

## Matriz tela → feature → componentes → estados → issue

| Tela/jornada do protótipo | Feature futura | Primitivas compartilhadas | Estados observados | Issue responsável |
|---|---|---|---|---|
| Splash | app/bootstrap | tema e surface | inicialização | #117-F, sem tela nesta task |
| Onboarding e proteção do cofre | `feature:onboarding` | botões, campos, chips, estado | progresso, foco, erro, seleção | #118 |
| Home vazia/preenchida | `feature:home` | card, estado, privacidade | vazio, loading, conteúdo oculto | #120 |
| Lista, detalhe, tipo, busca, cadastro e movimento | `feature:patrimonio` / `feature:ativo` | card, campo, chips, divisor | vazio, erro, validação | #119 e #120 |
| Histórico | `feature:historico` | chips, lista futura, estado | vazio, filtro, erro | #120 |
| Dados públicos | `feature:mercado` | estado offline e frescor futuro | offline, desatualizado | #124 e #125 |
| Backup e transferência | `feature:backup` | botões, campos e estado | etapas, falha, progresso | #121 |
| Ajustes e privacidade | `feature:ajustes` | chips, campos, conteúdo oculto | privacidade e bloqueio | #118; ajustes sem issue específica |
| Esquilo Completo/limites | não autorizado | nenhum | gratuito, limite, premium | **sem issue autorizadora** |

## Divergências e limitações registradas

- `Novo Esquilo.zip` altera fundo/superfície em relação ao ZIP de design system; a variante do protótipo móvel foi aplicada.
- O ZIP contém referências conflitantes de marca Esquilo e, em outro conjunto, 7A Labs; ambas foram deliberadamente excluídas. A identidade visual definitiva Savro permanece pendente.
- O protótipo representa monetização, gráficos, operações e jornadas completas; continuam fora da #185 e sem implementação.
- Contraste foi mapeado para o `ColorScheme` escuro e previews incluem `fontScale = 1.3`; auditoria visual final continua obrigatória quando cada tela futura for implementada.
