# Success Criteria — Plan V: Visual Identity Refresh ("The Ledger")
> Verified 2026-07-08 on `sendrow-v2`. 154/154 tests, tsc clean, next build passes.

1. ✅ No Manrope/Space Mono references remain — Fraunces (display serif) + Instrument Sans (body) + IBM Plex Mono (data, tabular numerals); Tailwind `font-mono` also mapped to Plex
2. ✅ Paper/ink/forest tokens live in globals.css; cards are white with hairline borders; new `--accent` (terracotta) + `--ink-band` tokens
3. ✅ No gradient blobs anywhere (`radial-gradient` grep = 0); landing + for-companies CTAs use the ink band
4. ✅ Inline status hex swept onto tokens — accepted exception: STATUS_COLOR maps using the `${hex}22` alpha-suffix trick (2 files) keep literal hex
5. ✅ One terracotta moment on the landing hero (eyebrow); footer "G" logo remnant fixed
6. ⚠ Visual QA in a browser is the remaining check (fonts/colors can't be asserted by tests)
