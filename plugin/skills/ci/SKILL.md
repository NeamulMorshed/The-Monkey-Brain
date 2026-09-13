---
description: Add a GitHub Actions CI safety net to the project — detects Node (npm, pnpm, yarn), Python, Go, .NET and Rust, and writes .github/workflows/ci.yml running the project's own lint, typecheck, test and build steps. Never overwrites an existing workflow without asking. Use when the user says "install CI", "set up CI", "add a CI pipeline", or the doctor reports a code project with no CI.
argument-hint: "[--force]"
model: sonnet
effort: low
---

# /brain:ci — a CI safety net in one step

Green CI is the evidence `/brain:review` and `/brain:wrap` want; red means not done.

1. **Preview:** `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/ci.js" --dry-run` — shows the
   detected stacks and the workflow it would write.
2. **Check it against the project** before writing: the right package manager, the scripts that
   actually exist, a test command that runs. If the project needs something the generator
   doesn't cover (services, secrets, a matrix), say so and adjust the file after writing.
3. **Confirm with the user, then write:** the same command without `--dry-run`. An existing
   `ci.yml` is left untouched unless the user asks to replace it (`--force`).
4. Offer a commit `feat: add CI workflow`; the first run happens on the next push.
