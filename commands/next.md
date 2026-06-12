---
description: Execute the next phase — load context, implement, run the verify pipeline, commit atomically, and update the roadmap and log.
argument-hint: "[phase id, optional — defaults to the active/next pending phase]"
---

# /crew:next

The core execution loop. Runs ONE phase to completion. Uses `crew-context` and `crew-planning` skills.

## Steps

1. **Load context.** Read `.planning/PROJECT.md`, `.planning/roadmap.md` (find the active `[>]` phase, else the next `[ ]`), its `.planning/plans/<slug>.md`, and the last entries of `.planning/log.md`. From these the **exact next step** must be unambiguous. If it is not, ask.
2. **Claim the phase.** Mark it `[>]` in `roadmap.md` and record the claim in `.planning/claims.json` (so parallel instances don't collide).
3. **Implement.** Do exactly what the plan's phase specifies, mirroring existing patterns. Model = `config.models.execution` (or auto). **Deviation handling (`execution.onDeviation`):** decide small in-intent deviations yourself and note them in the log; on a real problem, ambiguity, or scope change, **stop and ask**.
4. **Verify.** Run the verify pipeline per `config.verify` (phase override allowed): `verify` (tests/build/typecheck) → `review` → `harden` → `simplify`, each in a fresh sub-agent context. Summarize findings; critical findings block the commit until fixed or consciously waived. Security pass only if recommended and approved.
5. **Commit & record.** If `config.git.autoCommitPerPhase`: make one atomic conventional commit. Update `roadmap.md` (`[x]` + timestamp), append to `log.md` (phase, commit, verify result, and a token/cost note if `observability.trackCost`). Release the claim in `claims.json`.
6. **Report.** Summarize what shipped and name the next pending phase. Do not auto-continue to the next phase unless the user asks.

Never push or open a PR here — pushing and PRs require explicit approval and are out of this command's scope (`config.git.autoPush`/`autoPR` stay false by default).
