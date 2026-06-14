---
description: Execute phases — a whole milestone sequentially (default), one named phase by hand, or independent phases in parallel (dispatch).
argument-hint: "[phase id | auto | dispatch [ids]]"
---

# /crew:execute

The execution verb. `$ARGUMENTS` selects how execute runs the milestone's **phases**:

- **`/crew:execute`** — work through the active milestone's phases **sequentially** until done. The default (`workflow.execute.loop: all`). With `loop: one` configured it instead runs just the next phase and stops.
- **`/crew:execute [phase id]`** — run exactly ONE named phase to completion, then stop (whatever `loop` is set to).
- **`/crew:execute auto`** — force the sequential loop for this run (`workflow.execute.loop: all`), regardless of config — identical to a bare `/crew:execute` under the default.
- **`/crew:execute dispatch [ids]`** — run independent phases **in parallel** via worktrees (`workflow.execute.parallel`).

These are two of the **three granularities** (see `crew-conventions` → *Workflow vocabulary*): the **phase loop** (all vs one) and the **execution strategy** (sequential vs parallel). The **third** — `workflow.mode` (`manual | auto`) — is a *separate* axis: it governs whether, once the milestone's phases are done, execute **advances the step chain** into the close-out (Ship → Learn → Complete) or stops and only suggests it (see *Milestone end* below). So "auto" is never ambiguous: the `auto` **argument** loops phases; `workflow.mode: auto` chains steps.

Uses `crew-context` and `crew-planning`; `dispatch` additionally uses `git-merge` and the `merge-coordinator` agent.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Per phase (the building block)

These steps run once per phase — they are the unit both the default loop (`loop: all`) and a single `/crew:execute [phase id]` are built from.

1. **Load context.** Read `.planning/PROJECT.md`, `.planning/ROADMAP.md` (find the active `[>]` phase, else the next `[ ]`), its plan file under `.planning/plans/<n>_<milestone-slug>/<id>_…md` (glob `plans/**/*.md` to locate it by phase id), and the last entries of `.planning/LOG.md`. From these the **exact next step** must be unambiguous. **Idle routing:** if nothing is unambiguously runnable because the active milestone is fully done and the next milestone is **unplanned** (no `[ ]` phases written yet), route the user to `/crew:plan` (write the next phases) or `/crew:resume` (re-orient) instead of asking vaguely. If the next step is ambiguous for any other reason, ask.
2. **Milestone-boundary guard, then claim.** If the next `[ ]` phase belongs to a *different* milestone than the one just finished **and** that previous milestone is fully `[x]` (treat `[~]` deferred phases as not-blocking), **pause before claiming** and handle the close-out per **`workflow.mode`** (see *Milestone end* below) — under `manual` (default) **offer `/crew:finish`** (the Ship → Learn → Complete close-out strand) and let the user skip; this is also the canonical **Catch-up** behavior (`crew-conventions`). It only *offers*, it never self-finishes under `manual` (`config.git.autoPush`/`autoPR` stay false). Under `auto` advance per *Milestone end* below — the remote/prod boundary still holds either way. Then **claim:** mark the phase `[>]` in `ROADMAP.md` and record the claim in `.planning/claims.json` (so parallel instances don't collide).
3. **Implement.** Do exactly what the plan's phase specifies, mirroring existing patterns. Model = `config.models.execution` (or auto). **Deviation handling (`workflow.execute.onDeviation`):** decide small in-intent deviations yourself and note them in the log; on a real problem, ambiguity, or scope change, **stop and ask**.
4. **Verify.** Run the verify pipeline per `config.workflow.execute.verify` (phase override allowed): `test` (tests/build/typecheck) → `review` → `harden` → `simplify`, each in a fresh sub-agent context. Summarize findings; critical findings block the commit until fixed or consciously waived. `verify` is **never** auto-skipped — it has no `run`-gate. Security pass only if recommended and approved.
5. **Commit & record.** If `config.git.autoCommitPerPhase`: make one atomic conventional commit. Update `ROADMAP.md` (`[x]` + timestamp), append to `LOG.md` (phase, commit, verify result, and a token/cost note if `observability.trackCost`). Release the claim in `claims.json`.
6. **Report, then continue or stop.** Summarize what shipped and name the next pending phase. **Under the default `workflow.execute.loop: all`** (or `/crew:execute auto`), continue automatically to the next phase in a fresh context (see *auto* below). **Under `loop: one`, or when a single phase id was given,** stop here and let the user trigger the next phase.

Never push or open a PR here — pushing and PRs require explicit approval and are out of this command's scope (`config.git.autoPush`/`autoPR` stay false by default).

### Milestone end — `workflow.mode` (step chaining)

Once the active milestone's phases are all `[x]`/`[~]`, **`workflow.mode` decides what happens next** — this is the second granularity axis (step chain), independent of the phase loop:

- **`manual` (default)** — execute **stops** and only **suggests** `/crew:finish`. It never runs ship/learn/complete itself. This reproduces today's safe behavior and keeps the autonomy contract's "never self-finish" literal.
- **`auto`** — execute **advances the step chain** into the close-out, running **Ship → Learn → Complete** in order, each per its own `run`: `off` skip, `ask` ask at the boundary, `auto` run unasked, `smart` judge and run if worthwhile (`config.workflow.{ship,learn,complete}.run`). **"Run unasked" means entering the step and doing its *local* part only — `config.git` (`autoPush`/`autoPR`) stays the sole push/PR/merge authority regardless of `run`** (see the safety boundary below). The deliberate reversal of the M4 decoupling — but **governed by `mode`**, so it only happens when the user opted in. A stop within any chained step (a red `verify` in Ship, open phases blocking Complete) **halts the chain at that step** — the same stop-and-ask rule that applies to phases applies to each chained step; never continue past it.

**Safety boundary (load-bearing), holds under `auto` and `smart` alike:** advancing a step only *enters* it — **`config.git` stays the sole git/remote authority.** Even with `ship.run: auto`/`smart`, crew does **not** push, open a PR, or merge when `config.git.autoPush`/`autoPR` are false; it does the local part and asks. (When a `smart` step "decides to ship", it is deciding to *enter* ship and do the local work — **not** authorizing the push/PR.) And **`verify` is never auto-skipped** (no `run`-gate). "Run the step?" (`run`) and "touch the remote/prod?" (`config.git`) are orthogonal axes.

### Hand-off (single phase — `loop: one` or a named phase id)

When you ran just one phase (because `workflow.execute.loop: one` or a phase id was given), end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:execute` again for the next phase — or `/crew:finish` once the milestone is done (the Ship → Learn → Complete close-out strand). Under `workflow.mode: auto` this hand-off chains automatically per each step's `run` — chaining enters each step's *local* work; push/PR still require `config.git` approval.

Under the default `loop: all` you don't stop here — you continue to the next phase yourself (see *auto* below); the close-out hand-off still applies once the milestone's phases are all done.

## Autonomy contract (auto + dispatch)

`auto` and `dispatch` are **both autonomous milestone modes** — they differ only in *sequential* (`auto`) vs *parallel* (`dispatch`). Both obey the **same contract**:

- **Loop** the active milestone's remaining `[ ]`/`[>]` phases until done.
- **Full verify pipeline per phase** (the per-phase step 4, phase overrides honored).
- **Stop and ask** on a real deviation, ambiguity, scope change, or a **critical verify finding** — never paper over it.
- **The remote/prod boundary is absolute.** `config.git.autoPush`/`autoPR` stay false → crew never pushes, PRs, or merges without approval, whatever `workflow.mode`/`run` say. Under `workflow.mode: manual` (default) execute also never enters ship/learn/complete itself — it only **suggests** `/crew:finish`. Under `workflow.mode: auto` chaining into the close-out **is** the configured, pre-authorized action (each step per its `run`) — not a contract violation, because the hard remote boundary above is untouched and `verify` is never skipped.
- **At the end, report and suggest** the next step — **`/crew:finish`** (the Ship → Learn → Complete close-out strand) — leaving the deliberate action to the user under `manual`; under `auto` it has already chained per the step `run`s.

## auto — sequential autonomous run

`auto` is **the manual mode, automated** — **no sub-agents**. It runs the normal per-phase steps in the main context, then automates exactly the two commands you'd otherwise type by hand (this is also what a bare `/crew:execute` does under the default `loop: all`):

1. **Run the per-phase steps** (1–6 above) for the active/next pending phase — load → claim → implement → verify → commit → stamp `ROADMAP.md`/`LOG.md` → release the claim.
2. **Continue automatically.** If the active milestone still has pending `[ ]` phases **and** no stop condition fired, trigger **`/clear` followed by `/crew:execute auto`** (via the SlashCommand mechanism) so the next phase starts in a **fresh context**. Continuity rides on `.planning/` state — the re-invocation re-derives the next phase from `ROADMAP.md`, so clearing between phases is safe and loses nothing.
3. **Otherwise stop — or chain.** No pending phases left, or a stop condition fired → handle the milestone end per **`workflow.mode`** (*Milestone end* above): under `manual` (default) report and **suggest** `/crew:finish`; under `auto` advance the chain (Ship → Learn → Complete per each step's `run`). On a stop condition (deviation/critical finding), do **not** clear, re-invoke, or chain.

This keeps the `auto` **argument** identical to the manual loop (`/crew:execute` → `/clear` → `/crew:execute`), just without the manual typing — same branch, no worktrees, strictly sequential; the phase loop and `workflow.mode` stay independent. If `config.workflow.execute.parallel` is `auto` and the milestone has independent phases, you may propose switching to `/crew:execute dispatch` (with confirmation) instead of looping sequentially.

## dispatch [ids] — parallel autonomous run

Parallelize the phases that can safely run at once. Uses `crew-planning` (DAG) and the `git-merge` skill — **`git-merge` is the source of truth** for worktree isolation, claims, and integration; this mode drives it, it does not restate it. `[ids]` optionally narrows to specific phases or a milestone; default = the active milestone. Obeys the **autonomy contract** above — under `manual` it never enters ship/learn/complete; under `auto` it chains the close-out per each step's `run`; the remote/prod boundary (`config.git`) holds in either mode.

1. **Build the DAG.** Parse the active milestone's phases and their `depends:` edges from `ROADMAP.md`. Compute waves of independent phases.
2. **Confirm the plan.** Show which phases will run in parallel and which are sequential; wait for OK (or proceed if explicitly invoked).
3. **Dispatch a wave.** For each independent phase in the current wave, up to `config.workflow.execute.maxConcurrent` at a time:
   - Create a worktree + branch per `config.git.isolation` (default `worktree-per-feature`).
   - Claim the phase in `claims.json` (`@<worktree-id>`).
   - Run the phase as a sub-agent (implement + the verify pipeline, in isolation).
4. **Rolling integration.** As soon as a phase finishes **and verifies**, hand it to the `merge-coordinator` to integrate per `config.git.mergeStrategy` (`integration-branch` rolling · `pr` per phase · `ask-each`). Verify after each merge. In-flight worktrees rebase onto the new integration state to minimize drift.
5. **Next wave.** When a wave's phases are integrated, unlock the dependent phases (their deps are now done) and dispatch the next wave.
6. **Finish.** Report integrated phases, update `ROADMAP.md`/`LOG.md`, release claims, and clean up worktrees.
7. **Close-out.** Handle the milestone end per **`workflow.mode`** (*Milestone end* above): under `manual` (default) report and **suggest** `/crew:finish`; under `auto` advance the chain (Ship → Learn → Complete) per each step's `run`, with the same remote/prod boundary — `config.git` stays sole authority. On any stop condition, do **not** chain.

If a merge conflict is genuinely ambiguous, the `merge-coordinator` asks (`config.git.conflictPolicy`). On a real problem in any phase, stop and ask.
