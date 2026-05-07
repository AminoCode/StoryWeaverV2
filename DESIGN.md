# StoryWeaver — Design System

> Read this before writing any UI code.
> These are hard preferences, not suggestions.

---

## Aesthetic Direction

**Dark, refined product UI.** Dense data interfaces — controlled and precise. Every element earns its space. Visual weight communicates hierarchy, not decoration.

When a specific feature calls for it, dial toward brutalist: raw borders, monospace throughout, high contrast, exposed structure. That's a mode, not the baseline.

The default register is **serious, legible, and intentional** — not sterile, not flashy.

---

## Color System

All colors are CSS custom properties. Never hardcode hex values in components.

```css
:root {
  /* Backgrounds */
  --color-bg:          #0a0a0a;
  --color-surface:     #111111;
  --color-surface-2:   #1a1a1a;
  --color-surface-3:   #222222;

  /* Borders */
  --color-border:      #2a2a2a;
  --color-border-loud: #3a3a3a;

  /* Text */
  --color-text:        #f0f0f0;
  --color-text-muted:  #888888;
  --color-text-faint:  #444444;

  /* Accent — one per app, used sparingly */
  --color-accent:      #00d4aa;
  --color-accent-dim:  #00d4aa22;

  /* Semantic */
  --color-success:     #22c55e;
  --color-warning:     #f59e0b;
  --color-error:       #ef4444;
  --color-info:        #3b82f6;
}
```

**Rules:**
- Accent appears on 1–2 elements per screen max (active nav item, primary CTA, key metric)
- Never use accent as a large background fill
- `--color-text` on `--color-bg` always passes WCAG AA — verify muted text on elevated surfaces
- No light mode by default. If needed, define a separate `.theme-light` class

---

## Typography

```css
:root {
  --font-display: 'DM Mono', 'Fira Code', 'Consolas', monospace;
  --font-body:    'Inter', 'SF Pro Text', system-ui, sans-serif;
  --font-code:    'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}
```

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--text-xs` | 11px | 500 | Labels, badges, metadata |
| `--text-sm` | 13px | 400 | Secondary text, table cells |
| `--text-base` | 14px | 400 | Body copy, default |
| `--text-md` | 16px | 500 | Sub-headings, card titles |
| `--text-lg` | 20px | 600 | Section headings |
| `--text-xl` | 28px | 700 | Page titles |
| `--text-2xl` | 40px | 700 | Hero / display |

**Rules:**
- Never use Inter, Roboto, or Arial for display text — fine for body, not for headings
- Uppercase labels: `letter-spacing: 0.08em`
- Body line-height: `1.6` — Headings: `1.2`
- Use monospace for: numbers in tables/dashboards, code, terminal output, timestamps, tickers

---

## Spacing

Base unit: `4px`. All spacing is a multiple of 4.

```css
:root {
  --space-1:  4px;   --space-2:  8px;   --space-3:  12px;
  --space-4:  16px;  --space-5:  20px;  --space-6:  24px;
  --space-8:  32px;  --space-10: 40px;  --space-12: 48px;
  --space-16: 64px;
}
```

---

## Layout Principles

- **Density over whitespace** — this is a desktop app, not a marketing page. Pack information in. Use whitespace to separate sections, not pad individual components
- **Grid-first** — CSS Grid for page layout, Flexbox for component internals
- **Fixed shell, scrollable content** — sidebar and header never scroll; content regions do
- **No centered single-column layouts** unless it's a focused task UI (modal, form, onboarding step)
- **Minimum content width: 1024px** — Electron, not mobile

### Default shell pattern

```
┌─────────────────────────────────────────────────┐
│  Titlebar / drag region          (32px)         │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │  Main content area (scrollable)      │
│ (220px)  │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

---

## Component Patterns

### Buttons

```css
/* Primary — one per view max */
.btn-primary {
  background: var(--color-accent);
  color: #000;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: opacity 0.12s ease;
}
.btn-primary:hover  { opacity: 0.85; }
.btn-primary:active { opacity: 0.7; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Ghost — secondary actions */
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  /* same sizing as primary */
}
.btn-ghost:hover { border-color: var(--color-border-loud); color: var(--color-text); }

/* Danger — destructive only */
.btn-danger {
  background: transparent;
  color: var(--color-error);
  border: 1px solid var(--color-error);
}
```

### Cards / Panels

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: var(--space-4) var(--space-5);
}

.card-elevated {
  background: var(--color-surface-2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### Inputs

```css
.input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-base);
  padding: var(--space-2) var(--space-3);
  width: 100%;
  transition: border-color 0.1s ease;
}
.input:focus { outline: none; border-color: var(--color-accent); }
.input::placeholder { color: var(--color-text-faint); }
```

### Data Tables

- Header: `var(--color-surface-2)`, uppercase, `--text-xs`, `letter-spacing: 0.08em`
- Row dividers: `1px solid var(--color-border)` — no zebra striping by default
- Numeric columns: right-aligned, monospace
- Row hover: `background: var(--color-surface-3)`
- Selected row: `border-left: 2px solid var(--color-accent)` + `background: var(--color-accent-dim)`

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
}
.badge-default { background: var(--color-surface-3); color: var(--color-text-muted); }
.badge-accent  { background: var(--color-accent-dim); color: var(--color-accent); }
.badge-success { background: #22c55e18; color: var(--color-success); }
.badge-error   { background: #ef444418; color: var(--color-error); }
.badge-warning { background: #f59e0b18; color: var(--color-warning); }
```

### Loading States

Use skeleton loaders for content areas, not spinners. Spinner only for triggered actions (button click, form submit).

```css
.skeleton {
  background: var(--color-surface-2);
  border-radius: 4px;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}
```

---

## Motion & Animation

Motion communicates state change. It doesn't entertain.

**Rules:**
- Default transitions: `0.12s ease` for hover/focus
- Enter animations: `0.18s ease-out`
- No transitions on layout properties (width, height, padding) unless intentional and brief
- No looping animations except loading states and live data indicators
- Always respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Approved patterns:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeIn 0.18s ease-out forwards; }
```

---

## Anti-Patterns

These are automatic rejections. Do not build these.

| Anti-pattern | Instead |
|---|---|
| Purple / violet gradients on dark backgrounds | Flat surfaces defined by borders |
| `border-radius` > 8px on primary UI elements | 4–6px max |
| Glassmorphism / `backdrop-filter: blur` as primary surface treatment | Flat dark surfaces with clear borders |
| Box shadows as the primary depth indicator | Border color stepping + background layering |
| Emoji in UI chrome (nav, buttons, headers) | Icons or text labels |
| Full-width primary buttons | Size to content, left or right aligned |
| Centered hero layout in a desktop app | Use the full Electron window width |
| Inter or system-ui as the only typeface | Pair with a display or mono font |
| Spinning loaders everywhere | Skeleton loaders for content areas |
| Color as the only differentiator (red = error) | Color + icon + label |
| Dropping arbitrary `px` values outside the spacing scale | Use `--space-*` tokens |
| Hardcoded hex values in component styles | CSS custom properties only |

---

## Instructions for Claude Code

When building any UI component or page:

1. **Read this file first.** Apply color tokens, spacing scale, and typography by default
2. **Use CSS custom properties.** Never hardcode hex or arbitrary px values that duplicate a token
3. **Component CSS lives with the component.** `StockDashboard.jsx` → `StockDashboard.css` in the same folder
4. **Default to dark.** If theme isn't specified, use the dark surface system
5. **Prefer plain CSS with these tokens** over Tailwind utility classes
6. **Monospace for data.** Any numeric readout, ticker, timestamp, or code value uses `var(--font-display)` or `var(--font-code)`
7. **One primary action per view.** Don't stack multiple `.btn-primary` elements on the same screen
8. **If a design decision isn't covered here, flag it** rather than guessing
