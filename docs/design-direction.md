# Sendrow Design Direction — "The Ledger"
> Research + proposed visual system, 2026-07-08. Goal: kill the "AI-generated SaaS" look and make the site read as what we now are — the practice platform for climate consultants, audit-grade by construction.

## Why the current site reads "AI"
The current system is the exact recipe AI tools converge on: a friendly geometric sans everywhere (Manrope ≈ Inter-family), a washed pastel-green tint on every surface (`#F5FBF6` bg, `#EBF5ED` nav, `#DFF0E2` cards), soft rounded cards, gradient glow blobs in the hero. Individually fine; together they're the 2024–25 template default. Industry writing on "AI slop" design agrees: typography is the fastest escape (Inter-family sans is the giveaway), followed by killing the safe gradient wash and using one owned accent.

## Reference findings
- **Paymark template (Malachi's reference):** dark premium foundation + a single warm accent (coral), Inter Tight, restrained scroll motion. Takeaway: *one* confident accent color and premium restraint — not the dark theme itself (finance can go dark; climate/audit reads better light).
- **Watershed** (enterprise climate, the credibility benchmark): white/neutral background, dark charcoal text, muted accents, statistics and third-party validation doing the persuasion, minimal animation — "professional restraint" so the design never undermines scientific credibility.
- **Clio** (practice-platform-for-professionals, our category analogy): light, substance-over-flash, one brand accent, trust signals everywhere (certifications, review counts, support access). Whitespace and order mirror the orderliness the product sells.
- **Stripe pattern** (from trend research): serif display + clean sans body is the highest-leverage "premium, not template" signal available without commissioning a typeface.

## Proposed system

### Typography (all available via next/font/google — drop-in for layout.tsx)
| Role | Now | Proposed | Why |
|------|-----|----------|-----|
| Display / headlines | Manrope | **Fraunces** (variable serif, "soft" optical axes off) | Editorial authority; instantly not-a-template; warm enough for climate, serious enough for audit |
| Body / UI | Manrope | **Instrument Sans** | Grotesque with personality; crisp at UI sizes; emphatically not Inter |
| Data / figures | Space Mono | **IBM Plex Mono** | Tabular, ledger-like; Space Mono is quirky, Plex is bookkeeping — numbers ARE the product |

Pairing logic: serif speaks (headlines, pull-quotes), sans works (UI, body), mono counts (every tCO₂e figure, table, calc log). Setting all emissions figures in mono is the visual embodiment of "audit trail."

### Color — paper + ink + forest, one warm accent
Replace the green-tinted wash with warm paper neutrals; green becomes an *accent you earn*, not the wallpaper.

| Token | Now | Proposed | Note |
|-------|-----|----------|------|
| `--bg` | #F5FBF6 (mint wash) | **#FAF8F2** | warm paper — ledger stock, not screen-green |
| `--surface` | #EBF5ED | **#F2EFE7** | |
| `--card` | #DFF0E2 (green fill) | **#FFFFFF** + 1px `--divider` border | hairline borders > tinted fills; calmer, more "document" |
| `--text` | #0C1F12 | **#161D18** (ink) | near-black with a forest undertone |
| `--text-muted` | #5A7B62 | **#5F6B62** | desaturated — the green cast is what pastels the page |
| `--primary` | #1A5C30 | **#1D5A36** (keep family) | CTAs, links — continuity with the brand green |
| `--accent` (new) | — | **#C96F4A** terracotta | the "Paymark coral" move: badges, highlight underlines, the one warm moment per screen. Never for CTAs |
| `--ink-band` (new) | — | **#122619** deep forest-ink | dark footer + one hero band; the premium-dark nod without a dark theme |
| `--divider` | #C4DFCA | **#E4DFD2** | paper-toned hairlines |
| status/warning/danger | keep, desaturate slightly | | |

### Mood rules (what makes it not-AI)
1. **No gradient blobs, no emoji in product UI, no glassmorphism.** Hairlines, paper, ink.
2. **Numbers in mono, everywhere.** Dashboard totals, workpaper, portal — tabular figures with units.
3. **Serif only above the fold-weight.** H1/H2 in Fraunces; everything functional stays sans.
4. **One terracotta moment per screen.** Scarcity is what makes an accent premium.
5. **Specific copy over vibes** (already done in the pivot): real numbers, real formats, real deadlines.
6. **White-label neutrality in the app:** the app shell keeps everything on tokens so consultant branding (Plan K) can override cleanly; this refresh is tokens + fonts, no per-page forks.

## Implementation surface (small — the codebase is already tokenized)
- `app/layout.tsx`: swap `Manrope`/`Space_Mono` → `Fraunces` + `Instrument_Sans` + `IBM_Plex_Mono` (three `next/font` variables: `--font-display` (serif), `--font-body`, `--font-data`)
- `app/globals.css`: retheme the `:root` tokens per table; `body` font → `--font-body`
- `tailwind.config.ts`: `font-display` → serif var, `font-body` → sans var
- Sweep hardcoded hex in pages (`#fef9c3`, `#fecaca`, `#dc2626`, `#d97706` used inline ~20 places) onto tokens (`--warning-tint` etc.)
- Landing page: remove hero gradient blobs; add one `--ink-band` section; hero H1 in Fraunces
- No layout restructuring in this pass — typography + color carries the whole change

---

## Superseded 2026-07-10: "Aurora Pop" (Malachi's palette)
The Ledger retheme is replaced by Aurora Pop: glass cards (rgba white .66/.78, blur 14px) over #F8FCFA with fixed mint/teal/indigo radial washes; greens #178B5A (readable primary) / #22C55E / #10B981 / #6EE7B7 / #2DD4BF; one small indigo #6366F1 accent; pill gradient buttons; Plus Jakarta Sans + JetBrains Mono. Tokens in app/globals.css are the source of truth.
