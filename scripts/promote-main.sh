#!/usr/bin/env bash
# Builds the next `main` commit from origin/sendrow-v3, minus the dev-only files.
#
# `main` holds production code only. Tests, docs, scripts and the Claude setup live on
# sendrow-v3 and matthew-start. Because main deletes those files, a plain merge from v3 would
# bring them back (or conflict), so every main update goes through this script.
#
# Usage: scripts/promote-main.sh
# It commits on a throwaway worktree of origin/main, type-checks it, and prints the push
# command. It never pushes: pushing main deploys production and needs Malachi's say-so.
set -euo pipefail

DEV_ONLY=(CLAUDE.md DESIGN.md README.md docs contracts .claude test e2e scripts
          vitest.config.ts playwright.config.ts knip.json)

root=$(git rev-parse --show-toplevel)
wt="${TMPDIR:-/tmp}/sendrow-main-promote"

git -C "$root" fetch -q origin
git -C "$root" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
git -C "$root" worktree prune
git -C "$root" worktree add -q --detach "$wt" origin/main
cd "$wt"

# Edits to dev-only files show up as modify/delete conflicts here; removing them resolves those.
git merge --no-ff --no-commit origin/sendrow-v3 >/dev/null 2>&1 || true
git rm -r -q -f --ignore-unmatch "${DEV_ONLY[@]}"

conflicts=$(git diff --name-only --diff-filter=U)
if [ -n "$conflicts" ]; then
  echo "Real conflicts, resolve in $wt:"; echo "$conflicts"; exit 1
fi

git commit -q -m "release: sendrow-v3 $(git rev-parse --short origin/sendrow-v3) to main, dev-only files excluded" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

ln -s "$root/node_modules" node_modules
npx tsc --noEmit

echo
git log --oneline -1
echo "Dev-only files on main: $(git ls-files -- "${DEV_ONLY[@]}" | wc -l | tr -d ' ') (should be 0)"
echo "To publish:  git -C \"$wt\" push origin HEAD:main"
