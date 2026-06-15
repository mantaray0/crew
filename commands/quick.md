---
description: Quick lane — do a small fix or chore outside the roadmap without disturbing the active phase or claims.
argument-hint: "<what to do>"
---

# /crew:quick

For small fixes/chores that shouldn't go through the full brief→plan→execute flow and shouldn't disturb in-flight work.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. **Scope check.** Confirm the task is genuinely small and self-contained. If it's actually a feature, say so and route to `/crew:brief`.
2. **Don't disturb active work.** Do not touch claimed phases (`claims.json`) or in-flight worktrees. If `config.git.isolation` favors isolation and the working tree is busy, do the quick task on its own short-lived branch/worktree.
3. **Do it.** Implement the fix directly, mirroring existing patterns.
4. **Verify lightly.** Run tests/build/typecheck for the touched area (full verify pipeline is optional for quick tasks).
5. **Commit.** One atomic commit shaped by `config.git.commitPattern` (per `config.git`); never push/PR here.
6. **Log.** Add a one-line note to `LOG.md` so the quick change is traceable. Do not add it to the roadmap.

Keep it fast. The point is to clear small things without ceremony.
