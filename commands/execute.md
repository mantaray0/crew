---
description: Execute phases — one phase by hand (default), a whole milestone sequentially (auto), or independent phases in parallel (dispatch).
argument-hint: "[phase id | auto | dispatch [ids]]"
---

# /crew:execute

The execution verb. `$ARGUMENTS` selects the mode:

- **`/crew:execute [phase id]`** — run ONE phase to completion (manual / step-by-step). The default.
- **`/crew:execute auto`** — loop the active milestone **sequentially** and autonomously.
- **`/crew:execute dispatch [ids]`** — run independent phases **in parallel** via worktrees.

Uses `crew-context` and `crew-planning`; `dispatch` additionally uses `git-merge` and the `merge-coordinator` agent.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## One phase (default)

1. **Load context.** Read `.planning/PROJECT.md`, `.planning/ROADMAP.md` (find the active `[>]` phase, else the next `[ ]`), its plan file under `.planning/plans/<milestone-slug>/<id>-…md` (glob `plans/**/*.md` to locate it by phase id), and the last entries of `.planning/LOG.md`. From these the **exact next step** must be unambiguous. If it is not, ask.
2. **Claim the phase.** Mark it `[>]` in `ROADMAP.md` and record the claim in `.planning/claims.json` (so parallel instances don't collide).
3. **Implement.** Do exactly what the plan's phase specifies, mirroring existing patterns. Model = `config.models.execution` (or auto). **Deviation handling (`execution.onDeviation`):** decide small in-intent deviations yourself and note them in the log; on a real problem, ambiguity, or scope change, **stop and ask**.
4. **Verify.** Run the verify pipeline per `config.verify` (phase override allowed): `verify` (tests/build/typecheck) → `review` → `harden` → `simplify`, each in a fresh sub-agent context. Summarize findings; critical findings block the commit until fixed or consciously waived. Security pass only if recommended and approved.
5. **Commit & record.** If `config.git.autoCommitPerPhase`: make one atomic conventional commit. Update `ROADMAP.md` (`[x]` + timestamp), append to `LOG.md` (phase, commit, verify result, and a token/cost note if `observability.trackCost`). Release the claim in `claims.json`.
6. **Report.** Summarize what shipped and name the next pending phase. Do not auto-continue to the next phase unless the user asks.

Never push or open a PR here — pushing and PRs require explicit approval and are out of this command's scope (`config.git.autoPush`/`autoPR` stay false by default).

### Hand-off (one-phase mode)

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:execute` again for the next phase — or `/crew:retro` once the milestone is done.

## Autonomy contract (auto + dispatch)

`auto` and `dispatch` are **both autonomous milestone modes** — they differ only in *sequential* (`auto`) vs *parallel* (`dispatch`). Both obey the **same contract**:

- **Loop** the active milestone's remaining `[ ]`/`[>]` phases until done.
- **Full verify pipeline per phase** (the One-phase step 4, phase overrides honored).
- **Stop and ask** on a real deviation, ambiguity, scope change, or a **critical verify finding** — never paper over it.
- **Never self-ship or self-complete.** `config.git.autoPush`/`autoPR` stay false; do **not** run `/crew:ship` or `/crew:complete-milestone` yourself.
- **At the end, report and suggest** the next step (`/crew:complete-milestone` or `/crew:ship`) — leave the deliberate action to the user.

## auto — sequential autonomous run

`auto` is **the manual mode, automated** — **no sub-agents**. It runs the normal one-phase steps in the main context, then automates exactly the two commands you'd otherwise type by hand:

1. **Run the One-phase steps** (1–6 above) for the active/next pending phase — load → claim → implement → verify → commit → stamp `ROADMAP.md`/`LOG.md` → release the claim.
2. **Continue automatically.** If the active milestone still has pending `[ ]` phases **and** no stop condition fired, trigger **`/clear` followed by `/crew:execute auto`** (via the SlashCommand mechanism) so the next phase starts in a **fresh context**. Continuity rides on `.planning/` state — the re-invocation re-derives the next phase from `ROADMAP.md`, so clearing between phases is safe and loses nothing.
3. **Otherwise stop.** No pending phases left, or a stop condition fired → hand back to the user: report and suggest `/crew:complete-milestone` / `/crew:ship` per the autonomy contract. On a stop condition, do **not** clear or re-invoke.

This keeps `auto` identical to the manual loop (`/crew:execute` → `/clear` → `/crew:execute`), just without the manual typing — same branch, no worktrees, strictly sequential. If `config.execution.parallel` is `auto` and the milestone has independent phases, you may propose switching to `/crew:execute dispatch` (with confirmation) instead of looping sequentially.

## dispatch [ids] — parallel autonomous run

Parallelize the phases that can safely run at once. Uses `crew-planning` (DAG) and the `git-merge` skill — **`git-merge` is the source of truth** for worktree isolation, claims, and integration; this mode drives it, it does not restate it. `[ids]` optionally narrows to specific phases or a milestone; default = the active milestone. Obeys the **autonomy contract** above (no self-ship/-complete).

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
