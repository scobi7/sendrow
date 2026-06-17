# Canopy Frontend Restyle — Handoff

## Purpose

This is a restyle of an existing React/Next.js app, not a new build. The visual target is `canopy-final-direction.html` — open it directly for the authoritative reference. `dashboard-themes.html` contains two earlier directions (Ledger, Clearing) that were considered and rejected; ignore those sections, they're included for context only.

Product context: GHG emissions tracking plus California SB 253/261 climate disclosure reporting, with automated data import from QuickBooks Online and UtilityAPI.

## Before touching anything

- Find the existing token source — Tailwind config, a `theme.ts`/`tokens.css` file, a styled-components theme, whatever it is — and note what's currently there. That's what's being replaced.
- Find the existing shared-components folder, if one exists, so new components match established naming and file conventions rather than introducing a second pattern.
- Confirm whether Tailwind is already configured. If yes, extend its theme rather than running a parallel system. If no, add the CSS custom properties below to the global stylesheet and reference them directly — don't introduce Tailwind purely for this restyle if it isn't already there.
- The styling mechanism is secondary. What has to match is the reference file: colors, type, radius, spacing. Use whatever wiring fits the existing codebase.

## Design tokens

```css
:root {
  --bg: #F7F6EE;
  --text: #2E3A2E;
  --text-muted: #7C8A78;
  --primary: #3F6B4F;
  --primary-tint: #EFF6EC;   /* card fills */
  --track-bg: #E3EEDE;       /* chart track / progress backgrounds */
  --divider: #ECE8D9;
  --surface: #FFFFFF;
  --status-green: #2F9E68;
  --radius-lg: 28px;
  --radius-sm: 18px;
  --shadow-card: 0 24px 60px -28px rgba(63, 107, 79, 0.28);
  --font-display: 'Quicksand', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-data: 'IBM Plex Mono', monospace;
}
```

If Tailwind is in use, map these into `tailwind.config` (`theme.extend.colors`, `borderRadius`, `fontFamily`) by referencing the CSS variables rather than re-declaring hex values, so there's one source of truth.

## The typography rule

This is the actual design decision behind this restyle, so it's worth stating on its own: **`--font-data` is reserved for measured figures only** — emissions totals, scope values, chart data points, anything that's a rendered measurement. Category labels ("Scope 1"), captions, body copy, and headings never use it. Headings use `--font-display` (Quicksand); everything else uses `--font-body` (Inter). That contrast — warm rounded shapes, crisp mono numbers — is the whole point of merging the two earlier directions. Don't apply mono more broadly than this; it stops meaning anything if it's everywhere.

Use Next.js's built-in font loading rather than a manual `<link>` tag:

```ts
import { Quicksand, Inter, IBM_Plex_Mono } from 'next/font/google';

const quicksand = Quicksand({ subsets: ['latin'], weight: ['500','600','700'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-body' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500','600'], variable: '--font-data' });
```

## Components

Restyle these if they exist, build them if they don't:

- **KpiCard** — label (Inter, muted) / value (mono, `--text`) / sub-caption (Inter, muted). Background `--primary-tint`, radius `--radius-sm`.
- **IntegrationCard** — icon badge (initials on `--primary` background, white text), name, status row with a `--status-green` dot and "Connected · synced [time]" text.
- **ScopeBarChart** — one horizontal bar per scope. Bar width is relative to the *largest* scope's value, not relative to the total. Value label at the row's end, set in mono.
- **ComplianceTracker** — horizontal stepper. Takes a list of step labels plus a current-step index. Steps before the current one render "done" (filled circle, checkmark); the current step renders "active" (outlined circle); later steps stay muted. The connector line fills with `--primary` up to the active step.
- **DashTopbar** — logo, tab nav (active tab colored `--primary`), avatar circle.

## Pages

- **Overview / Dashboard** (existing route) — primary restyle target; should match `canopy-final-direction.html`. Roll the same tokens out to any other existing authenticated pages (Emissions detail, Integrations settings, Reports) even though they aren't individually mocked up here — Overview is the reference implementation for the rest.
- **Homepage / marketing landing** — new section, see below.

## Homepage

Hero, subhead, a row of three stat callouts, then a CTA — same visual language as the dashboard (warm background, rounded cards, Quicksand for the headline, mono for the stat numbers).

- `[XX]% faster time-to-questionnaire` — placeholder carrying the number you mentioned. Confirm the real figure before this ships.
- `[X] fewer compliance hires needed` — placeholder for the headcount-reduction stat. Confirm both the number and the exact phrasing before this ships.
- `Synced automatically from QuickBooks and UtilityAPI` — this one's a capability statement, not a metric, so it's safe to ship as written.

Don't let either of the first two ship as hardcoded real numbers without the actual figures behind them — they're written as placeholders for a reason.

## Accessibility and responsive

- Visible `:focus-visible` outline on every interactive element.
- Respect `prefers-reduced-motion` for any transitions.
- KPI and integration grids collapse to fewer columns below ~760px; tab nav can hide on mobile.

## Confirm before shipping

- Real numbers for the two homepage stat placeholders.
- Whether "Canopy" is the real product name or still a placeholder — swap the 🌱 emoji logo for a real asset regardless.
- Whether Tailwind is already in the codebase (changes the implementation mechanism, not the visual target).
