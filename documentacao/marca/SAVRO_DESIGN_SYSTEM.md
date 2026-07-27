# Savro — Design System (fonte de verdade)

> Substitui `ESQUILO_INVEST_DESIGN_SYSTEM.md`, `DESIGN_SYSTEM_COMPONENTS.md`, `DESIGN_SYSTEM_QUICKSTART.md`
> e `README_DESIGN.md` como referência vigente de marca/UI. Esses arquivos ficam mantidos como
> histórico, não como fonte de verdade — ver `documentacao/marca/`.

**Projeto de origem (claude.ai/design):** https://claude.ai/design/p/abe5910f-d043-47ec-a4df-2bff8715cf39
**Project ID:** `abe5910f-d043-47ec-a4df-2bff8715cf39` — nome no claude.ai: "Esquilo Wallet Design System"

Esse projeto é a **fonte única de verdade** do design system do produto (rebrand: **Esquilo Wallet/Invest → Savro**),
cobrindo web (React) e a base visual que a frente Android/Compose (`android/`, projeto "Savro" já em
desenvolvimento) também segue.

---

## Nome da marca

Nome fixo: **Savro**. Nunca usar "Savro Wallet", "Savro Invest", "Savro Finance" ou qualquer sufixo.
Sem slogan embutido na logo. Não introduzir ícones financeiros genéricos (cifrão, moeda, seta de
crescimento, escudo, cadeado, folha, animal, carteira) nem a combinação "SV" como símbolo.

## Identidade visual

- **Símbolo:** ícone hexagonal facetado, azul-marinho `#082448`, com uma faceta central laranja de
  assinatura `#F17806`. O laranja ocupa menos de 10% da composição em qualquer aplicação.
- **Wordmark:** "savro" em lettering geométrico customizado, sempre minúsculo.
- **Vetores-fonte** (fonte única de verdade, não redesenhar): `documentacao/marca/assets-savro/`
  - `savro-icone.svg` / `savro-icone-white.svg`
  - `savro-marca.svg` / `savro-marca-white.svg` (wordmark isolado)
  - `savro-logo-completo.svg` / `savro-logo-completo-white.svg` (ícone + wordmark)
- **Área de proteção:** espaço livre mínimo ao redor do símbolo/logo equivalente à altura de uma
  faceta do hexágono.
- **Ícone adaptativo Android:** suporta rounded square, círculo e squircle.
- **Usos incorretos proibidos:** distorcer proporção, trocar cores do ícone, reduzir opacidade/dessaturar,
  adicionar halo/brilho decorativo.

## Design tokens

Cores (dark, base do produto):

| Token | Valor | Uso |
|---|---|---|
| `--bg-primary` | `#07111F` | Fundo principal |
| `--bg-secondary` | `#0D182A` | Fundo secundário |
| `--surface` | `#13213A` | Superfície de card |
| `--surface-elevated` | `#192A49` | Superfície elevada |
| `--primary` | `#4772F5` | Ação primária |
| `--primary-pressed` | `#3A5FE0` | Estado pressionado |
| `--secondary` | `#5FA8FF` | Secundária / foco |
| `--accent` | `#F5A23A` | Destaque |
| `--positive` | `#29D3B2` | Sucesso / valorização |
| `--warning` | `#F4C95D` | Alerta |
| `--negative` | `#F06B7A` | Erro / desvalorização |
| `--info` | `#5FA8FF` | Informativo |
| `--border` | `rgba(255,255,255,.08)` | Borda |
| `--divider` | `rgba(255,255,255,.05)` | Divisor |
| `--focus` | `#5FA8FF` | Anel de foco |
| `--text-primary` | `#F7F9FC` | Texto principal |
| `--text-secondary` | `#A3AEC3` | Texto secundário |
| `--text-tertiary` | `#7F8AA3` | Texto terciário |
| `--text-inverse` | `#07111F` | Texto sobre fundo claro |
| `--overlay` | `rgba(7,17,31,.6)` | Overlay |
| `--scrim` | `rgba(7,17,31,.85)` | Scrim de modal |
| `--disabled-bg` | `rgba(255,255,255,.06)` | Fundo desabilitado |
| `--disabled-text` | `#5A6478` | Texto desabilitado |

Raio de borda: `--radius-sm 8px` · `--radius-md 12px` · `--radius-lg 16px` · `--radius-xl 20px` · `--radius-pill 999px`

Espaçamento (escala de 4px): `--space-1 4px` · `--space-2 8px` · `--space-3 12px` · `--space-4 16px` ·
`--space-5 20px` · `--space-6 24px` · `--space-7 32px` · `--space-8 40px` · `--space-9 48px` · `--space-10 64px`

Tipografia: `--font-display: 'Manrope', sans-serif` (700/800) · `--font-body: 'Inter', sans-serif` (400–700)

Sombras e gradientes:
- `--shadow-card: 0 28px 56px -20px rgba(0,0,0,.75), 0 8px 16px -8px rgba(0,0,0,.4)`
- `--shadow-cta: 0 14px 28px -10px rgba(71,114,245,.55)`
- `--gradient-bg: linear-gradient(180deg,#16294a 0%,#0d1c33 28%,#07111F 60%,#04090f 100%)`
- `--gradient-surface: linear-gradient(180deg,#1c3157 0%,#111f38 100%)`
- `--gradient-primary: linear-gradient(155deg,#5B84FF 0%,#4772F5 45%,#2F55D6 100%)`

Fonte primária dos tokens: `styles.css` do projeto claude.ai/design (mesmos nomes de variável).

## Componentes e telas documentados no projeto

O projeto claude.ai/design organiza o design system em cards por grupo — consultar via sync
(processo abaixo) antes de implementar qualquer tela nova:

`Brand`, `Tokens`, `Colors`, `Typography (Type)`, `Buttons`, `Cards`, `Forms`, `Navigation`,
`Overlays`, `Selection`, `States`, `Feedback`, `Charts`, `Premium`, `Trust`, `Wealth`, `Privacy`,
`Primitives`, `Backup`, `Docs`.

Templates de tela completos (referência de composição, não copiar 1:1 sem adaptar ao domínio real):
`Cadastro manual`, `Detalhe do item`, `Home`, `Lista patrimonial`.

## Como sincronizar de novo (versão mais atual)

O design system em claude.ai/design é a fonte viva — este arquivo é um espelho pontual (sincronizado
em 2026-07-27). Para pegar a versão mais atual antes de qualquer trabalho de UI:

1. Usar a tool `DesignSync` (disponível a agentes com acesso a design-system claude.ai) com
   `projectId: abe5910f-d043-47ec-a4df-2bff8715cf39`.
2. `list_files` → comparar com a lista de grupos acima; se houver arquivo novo/removido, atualizar
   a seção "Componentes e telas documentados" deste arquivo.
3. `get_file` no(s) arquivo(s) relevante(s) à tarefa (ex.: `buttons.html`, `forms.html`, `tokens.html`
   ou `styles.css` para os tokens completos) — ler o card específico em vez de baixar tudo.
4. Se os tokens em `styles.css` divergirem dos valores listados acima, atualizar a tabela de tokens
   deste arquivo e registrar a mudança (data + o que mudou) nesta seção.
5. Não há polling automático — este é um processo manual. Rodar o sync sempre que uma tarefa de UI
   depender de precisão visual (cor exata, espaçamento, variante de componente) que este resumo não
   cubra.

## Observação — divergência com telas/componentes existentes

Não foi feita nenhuma refatoração de UI nesta sincronização (fora de escopo). Telas e componentes já
implementados no `apresentacao/` (React) e no `android/` ainda podem referenciar a paleta/nome antigo
"Esquilo Invest" — alinhar ao Savro é trabalho de implementação separado, a ser planejado como tarefa
própria.
