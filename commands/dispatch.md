---
description: Run independent phases in parallel — build a dependency DAG, work each phase in its own worktree via sub-agents, and roll them into an integration branch.
argument-hint: "[milestone or phase ids, optional]"
---

# /crew:dispatch

Parallelize the phases that can safely run at once. Uses `crew-planning` (DAG) and `git-merge` skills, and the `merge-coordinator` agent. Also runs automatically (with confirmation) from `/crew:execute` when `config.execution.parallel` is `auto` and independent phases are detected.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. **Build the DAG.** Parse the active milestone's phases and their `depends:` edges from `ROADMAP.md`. Compute waves of independent phases.
2. **Confirm the plan.** Show which phases will run in parallel and which are sequential; wait for OK (or proceed if explicitly invoked).
3. **Dispatch a wave.** For each independent phase in the current wave, up to `config.execution.maxConcurrent` at a time:
   - Create a worktree + branch per `config.git.isolation` (default `worktree-per-feature`).
   - Claim the phase in `claims.json` (`@<worktree-id>`).
   - Run the phase as a sub-agent (implement + the verify pipeline, in isolation).
4. **Rolling integration.** As soon as a phase finishes **and verifies**, hand it to the `merge-coordinator` to integrate per `config.git.mergeStrategy` (`integration-branch` rolling · `pr` per phase · `ask-each`). Verify after each merge. In-flight worktrees rebase onto the new integration state to minimize drift.
5. **Next wave.** When a wave's phases are integrated, unlock the dependent phases (their deps are now done) and dispatch the next wave.
6. **Finish.** Report integrated phases, update `ROADMAP.md`/`LOG.md`, release claims, and clean up worktrees.

If a merge conflict is genuinely ambiguous, the `merge-coordinator` asks (`config.git.conflictPolicy`). On a real problem in any phase, stop and ask.
