# Quanto — Design System v4

Inter-only, 4px grid, shadow depth + hero section. Inspired by Mobills and polished native finance apps.

## Typography

Single font family: **Inter** (400, 500, 600, 700).

| Token | Size | Weight | Use |
|---|---|---|---|
| kpi | 36px | 700 | Main patrimony number |
| page-title | 20px | 700 | Screen titles (Carteira, Historico) |
| sheet-title | 17px | 700 | Bottom sheet headings |
| section | 14px | 600 | Section titles, labels |
| body | 14px | 400 | Default text |
| body-strong | 14px | 600 | Emphasized body text, asset names |
| caption | 12px | 500 | Secondary info, dates, metadata |
| overline | 11px | 600 | Uppercase labels, group headers |
| tab | 10px | 600 | Tab bar labels |

Letter-spacing: `-0.02em` for titles, `0.06em` for overlines, `0` for body.

## Hero section

The hero wraps the main KPI area at the top of the Hoje screen. It does NOT wrap the freshness card, allocation section, or quote-info.

| Property | Value |
|---|---|
| Class | `.hero` |
| Background | `var(--petro)` |
| Text color | `#FFFFFF` |
| Border-radius | `0 0 24px 24px` |
| Padding | `20px 20px 28px 20px` |
| Layout | Edge-to-edge horizontally (breaks out of screen padding) |

Contents (top to bottom): greeting text, "PATRIMONIO TOTAL" overline, KPI big number (`.kpi-value`), gain line, redeeming line.

### Text colors inside hero

| Element | Color |
|---|---|
| Overline / labels (`.overline` inside `.hero`) | `rgba(255,255,255,0.7)` |
| Gain / subtitle text | `rgba(255,255,255,0.85)` |
| KPI number | `#FFFFFF` (full opacity) |

KPI number also has `text-shadow: 0 1px 2px rgba(0,0,0,0.1)`.

Dark mode: same approach — dark-mode `--petro` is already `#3B8A99`.

## Colors

### Light mode

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#111820` | Primary text |
| `--ink-secondary` | `#334155` | Secondary text |
| `--paper` | `#F8FAFC` | Page background |
| `--surface` | `#FFFFFF` | Cards, header, tabbar |
| `--elevated` | `#FFFFFF` | Same as surface in light |
| `--mist` | `#E2E8F0` | Borders, dividers, tracks |
| `--slate` | `#64748B` | Tertiary text, icons |
| `--petro` | `#1B4D57` | Primary accent |
| `--petro-hover` | `#164249` | Accent hover state |
| `--petro-subtle` | `#E0F2F1` | Accent tint backgrounds |

### Dark mode (`html.dark`)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#E2E8F0` | Primary text |
| `--paper` | `#0A0F14` | Page background (darkest) |
| `--surface` | `#111820` | Cards, header |
| `--elevated` | `#1A2332` | Higher surfaces |
| `--mist` | `#1E293B` | Borders, dividers |
| `--slate` | `#94A3B8` | Tertiary text |
| `--petro` | `#3B8A99` | Accent (lighter for contrast) |

Dark mode uses elevation hierarchy: darker = lower, lighter = higher.

### Semantic colors

| Token | Hex | Use |
|---|---|---|
| `--verde` | `#16A34A` | Positive gains |
| `--vinho` / `--red` | `#DC2626` | Negative, destructive |
| `--amber` | `#D97706` | Warnings, stale data |

Each has a `-subtle` variant for tinted backgrounds.

### Chart segment colors

```
--seg-1: #1B4D57 (petro)
--seg-2: #16A34A (green)
--seg-3: #D97706 (amber)
--seg-4: #DC2626 (red)
--seg-5: #6366F1 (indigo)
--seg-outros: #94A3B8 (neutral)
```

### Institution colors

Used for institution indicator dots (`.inst-dot`).

| Code | Color | Hex |
|---|---|---|
| XP | Purple | `#7C3AED` |
| ITAU | Orange | `#F97316` |
| ONZE | Teal | `#14B8A6` |
| OUTROS | Slate | `#94A3B8` |

`.inst-dot` specs: `display: inline-flex`, `align-items: center`, `justify-content: center`, `width: 36px`, `height: 36px`, `border-radius: 50%`, `font-size: 13px`, `font-weight: 700`, `color: white`, `flex-shrink: 0`. Content is the first letter of the display name.

Smaller variant in asset list items: 28px diameter.

## Spacing

Strict 4px grid. All spacing values are multiples of 4px.

| Value | Use |
|---|---|
| 2px | Inline gaps (toggle pill inner) |
| 4px | Tight spacing, chip gaps, badge padding |
| 6px | Small gaps |
| 8px | Component internal padding, icon gaps |
| 12px | Section title margin-bottom |
| 16px | Card internal padding (vertical) |
| 20px | Screen padding (horizontal), gap between cards/sections |
| 24px | Bottom sheet internal padding (vertical) |
| 32px | Large spacing |
| 48px | Empty state padding |
| 100px | Bottom padding (tab bar + FAB clearance) |

## Border radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Badges, small elements |
| `--radius-sm` | 8px | Buttons |
| `--radius` | 12px | Inputs |
| `--radius-md` | 16px | Cards, FAB |
| `--radius-lg` | 20px | Chips, filters, bottom sheet top corners |
| `--radius-hero` | 24px | Hero section bottom corners |

## Elevation

Shadow-based in light mode, border-based in dark mode.

### Light mode

Cards use shadows instead of borders:
```
box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0.5px 2px rgba(0,0,0,0.04);
border: none;
```

### Dark mode

Cards use borders instead of shadows (shadows are invisible on dark backgrounds):
```
border: 1px solid var(--mist);
box-shadow: none;
```

Dark mode elevation hierarchy through background lightness:
- `--paper` (lowest): `#0A0F14`
- `--surface` (cards/header): `#111820`
- `--elevated` (overlays): `#1A2332`

## Layout

| Element | Height |
|---|---|
| Header | 52px |
| Tab bar | 52px |
| FAB | 48px |
| Header action buttons | 36x36px |
| Filter chips | 32px min-height |
| Form chips | 32px min-height |

App shell: max-width 430px, centered. Side borders on desktop.

Screen content: `padding: 20px 20px 100px` (100px bottom for tab bar + FAB clearance).

## Components

### Toggle pill
Background `--mist`, inner buttons with 20px radius (pill shape). Active state uses `--surface` background.

### Filter chips
1px border, 20px radius (pill shape). Selected: `--petro` background, white text.

### Cards (fresh-card, chart-card)
16px radius, `--surface` background, `padding: 16px 20px`.
- Light mode: shadow elevation (see Elevation section), no border.
- Dark mode: `1px solid var(--mist)` border, no shadow.

### Buttons
- **Primary**: `--petro` bg, white text, 8px radius, 12px padding
- **Ghost**: transparent bg, 1px `--mist` border, 8px radius
- **Danger**: `--red-subtle` bg, `--red` text

### Bottom sheets
20px top radius (`border-radius: 20px 20px 0 0`), `--surface` background. Internal padding: `24px 20px`. 32px drag handle, 4px height.

### Badges
4px radius, 10px font, 600 weight, uppercase. Variants: auto, manual, manual-ok, resgate.

### Inputs
1px `--mist` border, 12px radius, 10px 12px padding. Focus: `--petro` border (no glow).

### FAB
`border-radius: 16px`, `box-shadow: 0 4px 14px rgba(0,0,0,0.18)`.

### Tab bar
- Light mode: `box-shadow: 0 -2px 8px rgba(0,0,0,0.04)`, no border-top. Background `var(--surface)`.
- Dark mode: `border-top: 1px solid var(--mist)`, no shadow. Background `var(--surface)`.

### Allocation legend
Each row: `display: flex`, `align-items: center`, `gap: 12px`. Left side: inst-dot (36px circle). Right side: institution name on one line, value and percentage below or to the right.

### Toast
8px radius, `--ink` background, `--paper` text. No shadow.

## Donut chart

160x160px container. SVG viewBox `0 0 160 160`.
- Outer radius: 72
- Inner radius: 46
- Center text: 14px bold value, 11px label

## Dark mode behavior

Toggle via button in header. Persisted in `localStorage('quanto-dark')`.
Falls back to `prefers-color-scheme: dark` media query when no preference saved.

Theme-color meta tag updates: light `#1B4D57`, dark `#0A0F14`.

## Iconography

Feather-style SVG icons, 20x20px in header/tabbar, stroke-width 1.8.
Active tab increases stroke-width to 2.2.

## Fonts loaded

Only Inter: regular (400), medium (500), semibold (600), bold (700).
Self-hosted woff2 files in `/fonts/`. Preloaded in HTML `<head>`.
