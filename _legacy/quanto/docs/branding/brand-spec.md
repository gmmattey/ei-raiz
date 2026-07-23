# Quanto — Brand Spec

Extraído da imagem de referência + síntese das 8 referências Dribbble fintech.

## Postura visual

Monocromático de alta precisão. Fundo limpo, tipografia como hierarquia principal, cor como sinal financeiro — nunca como decoração. Estética de app bancário premium brasileiro (minimalismo + legibilidade + confiança).

## Tokens de cor (OKLch)

```css
:root {
  --bg:      oklch(97% 0.006 220);   /* #F7F9FA — off-white levemente frio */
  --surface: oklch(100% 0 0);        /* #FFFFFF — cards e modais */
  --fg:      oklch(12% 0.016 250);   /* #111318 — near-black com leve tint azul */
  --muted:   oklch(50% 0.016 250);   /* #6B7280 — texto secundário */
  --border:  oklch(91% 0.008 240);   /* #E5E7EB — bordas e divisores */
  --accent:  oklch(12% 0.016 250);   /* near-black — CTA principal */

  /* Sinalização financeira */
  --positive: oklch(50% 0.16 145);   /* #16A34A — ganho / verde */
  --negative: oklch(50% 0.20 25);    /* #DC2626 — perda / vermelho */
  --warn:     oklch(70% 0.16 70);    /* #F59E0B — alerta / âmbar */

  /* Superfícies de profundidade */
  --surface-2: oklch(95% 0.006 220); /* #F0F2F5 — fundo de seção, chips */
  --surface-3: oklch(92% 0.010 220); /* #E8EAED — estado selecionado */
}
```

## Tipografia

- **Display / Saldo**: 'DM Sans', -apple-system, sans-serif — peso 600–700, tracking -0.03em
- **Body / Label**: system-ui, 'Roboto', sans-serif — peso 400/500
- **Mono / Valores**: 'DM Mono', ui-monospace, monospace — tabular-nums

## Postura de layout (5 regras)

1. **Raio de borda**: 16px em cards, 12px em inputs, 999px em chips/badges/botões pill
2. **Sombra**: box-shadow leve (0 1px 3px rgba(0,0,0,0.08)) — nunca pesada
3. **Accent budget**: near-black (#111318) para CTAs; verde APENAS em variação positiva; vermelho APENAS em perda
4. **Espaçamento base**: 8px grid (4dp Android). Padding interno de cards: 20px. Gap entre elementos: 12–16px
5. **Tipografia de valor**: sempre `font-variant-numeric: tabular-nums` em campos monetários
