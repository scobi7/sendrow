# Sendrow

System of record for supplier emissions data, operated through sustainability consultants. A consultant sends a client (a supplier) a data request; the client responds through a magic-link portal (no account, evidence attached to every figure); the consultant reviews, approves and freezes a dated snapshot, the only thing ever shared externally. Consultants are the only paying customer. Suppliers respond free. Buyers are a 2027+ phase, not built.

Stack: Next.js 15 App Router, Clerk v6, Neon Postgres + Drizzle, Vercel Blob, Stripe (gate disabled), Resend (raw fetch, no SDK), Vitest.

## Start of every session
Read this file, then `docs/progress.md`, `docs/decisions.md` and `docs/known-issues.md`. Read `contracts/invariants.md` before changing any code.

## How we work: orchestrator and workers
- You (the main session) are the orchestrator. You plan, write briefs and check results. Do not do bulk work yourself when a worker can do it.
- Workers are subagents on Haiku, one job each:
  - `builder` writes code to a brief, runs the check, reports the command it ran and the output.
  - `reviewer` reads a diff against a brief and lists what fails it. Read-only.
  - `auditor` audits an area for problems and proves each with a command. Read-only. Use it for tech-debt and code audits.
  - Built-in agents (Explore, Plan, general-purpose) also run on Haiku because of `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. Explore only locates code; don't use it for audits.
- Parallel builders must get disjoint files. Two workers editing the same file at once will clobber each other.
- Every brief states the goal, the files to read, and a "Done when:" check that can be run or seen. Keep briefs short.
- Before accepting any worker's output, run its check yourself. If it fails, send it back with the failure. Never pass on a worker's report unchecked.
- For anything bigger than a small fix, show Malachi the plan and wait for approval before briefing workers.

## End of every session
Update `docs/progress.md` (now, next, one dated log line), add new decisions and gotchas, then run the `reflect` skill: propose skill or CLAUDE.md edits with evidence from the session. Malachi approves them before you apply them.

## Rules
- Branches: work on `sendrow-v3`. `matthew-start` is Matthew's front-end branch; merge it into v3 to ship his work. `main` is production code only (no tests, docs, scripts or Claude setup): update it only with `scripts/promote-main.sh`, never a plain merge, and push it only when told. Never commit to `sendrow-v1` (frozen pre-pivot archive).
- House style: no emojis and no em dashes anywhere in product UI or copy. Grep new copy before calling it done.
- Do only the essential work that was asked for. No speculative features, no drive-by refactors.
- Never break `contracts/invariants.md`. Most at risk: tenant isolation (`ownsClient()`), snapshot immutability, formats as config.

## Checks
- `npm run lint` (tsc --noEmit) and `npm test` (vitest): run both before calling code done.
- `npm run knip` lists unused files, exports and dependencies. Next.js route files are entry points, not dead code; verify each hit with grep.
- `npm run build` runs `drizzle-kit push --force` against the database in `DATABASE_URL` first. Don't run it casually, and never remove a table or column from `lib/db/schema.ts` without Malachi's explicit OK: the next deploy drops it in production.

## Folder map
- `docs/progress.md` where we are: now, next, waiting on Malachi, dated log
- `docs/decisions.md` what's settled, with date and why (the long-term memory)
- `docs/known-issues.md` gotchas and their fixes
- `docs/plan-w-spec.md` build spec for the open phases W3 to W7
- `docs/` also holds dated research and design docs (check the date before trusting one)
- `contracts/invariants.md` hard rules; code comments cite it as `contracts/ §N`
- `.claude/agents/` workers; `.claude/skills/` one folder per repeatable task (`reflect`)
- `app/` routes: `consultant/` (the product), `portal/[token]` (client magic link, white-label), `shared/[token]` (read-only snapshot page), `admin/` (gated by `ADMIN_CLERK_ID` in `middleware.ts`), `api/`, marketing pages
- `components/` UI; `components/pdf/` PDF reports
- `lib/` logic: `calc.ts` and `factor-engine.ts` (the two calc paths), `factors.ts`, `formats.ts`, `mapping.ts`, `ingestion/`, `portal.ts`, `consultant-actions.ts`; `lib/db/` Drizzle schema and migrations
- `test/` unit and contract tests; `scripts/reset-demo.ts` resets demo data
