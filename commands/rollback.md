---
description: Safely revert to the last verified phase commit when a phase went wrong.
argument-hint: "[phase id or commit, optional — defaults to the last verified phase]"
---

# /crew:rollback

Undo a botched phase. Atomic per-phase commits make this cheap.

## Steps

1. **Identify the target.** From `log.md`/git history, find the last verified phase commit (or the one the user names). Show what will be undone (commits, files).
2. **Confirm.** Reverting changes state — get explicit confirmation before acting.
3. **Revert.** Prefer `git revert` of the phase's commit(s) to preserve history (use reset only if the user explicitly wants history rewritten and the commits aren't shared). Keep the working tree clean.
4. **Restore planning state.** Set the phase back to `[ ]`/`[>]` in `roadmap.md`, append a `log.md` note recording the rollback and why, and release any stale claim in `claims.json`.
5. **Verify.** Run tests/build to confirm the reverted state is green.
6. **Report.** What was rolled back, the resulting commit, and the suggested next step (re-plan via `/crew:adjust`, or retry via `/crew:next`).

Never rewrite shared/pushed history without explicit instruction.
