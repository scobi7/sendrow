---
name: reflect
description: End-of-session review. Lists what went wrong or took too long, proposes the smallest skill or CLAUDE.md edit that would have prevented it, and waits for approval.
---

Run at the end of a session.

1. List what went wrong or took too long: failed worker checks, rework, wrong assumptions, repeated mistakes. Cite the evidence (what happened, which brief or command).
2. For each, propose the smallest edit to a skill, agent file or CLAUDE.md that would have prevented it. Show the exact before/after text.
3. Also list new decisions for `docs/decisions.md` and gotchas for `docs/known-issues.md`.
4. Stop and wait for the user's OK. Apply only the edits they approve.
