---
description: Run the active milestone's phases, each in a fresh executor sub-agent — all in sequence, or one named phase.
argument-hint: "[phase id]"
---

# /crew:execute

Load the `crew-state` skill. Resolve `workflow.execute.loop`, `workflow.execute.review` and `language.files` before step 1.

## Steps

1. **Pick the phase.** A phase id in `$ARGUMENTS` → that phase, and only it. Otherwise the next phase (`crew-state` → ROADMAP). Nothing runnable → say why and route: milestone fully done → step 6; next milestone has no phases → `/crew:plan`; blocked by `depends:` → name the blocker.
2. **Claim** it: `[>]` in `ROADMAP.md`.
3. **Run it** in a fresh sub-agent of type `crew:executor`. Its prompt: phase id, plan file path, `_spec.md` path, review effort, `language.files`. Wait for it to hand back.
4. **Check the hand-back.** The phase is done only when `ROADMAP.md` shows it `[x]`, `LOG.md` has its line, and `git log` has its commit. Anything missing → tell the user what is missing and ask whether to rerun the phase. If the executor reports the `code-review` skill unavailable, run it here on the phase commit with the same effort, settle each finding (fix, or reject with one sentence) and commit the fixes.
5. **Report** in a few lines: phase, commit, checks, review (fixed count, each rejected finding with its reason). On a `stopped` hand-back, put the executor's options to the user and run no further phase.
6. **Continue.** With `loop: all`, no phase id given and no stop: back to step 1. When the milestone's phases are all `[x]` or `[~]`, offer to close it (`crew-state` → Closing a milestone); commit the result as `docs(planning): close <milestone>` if `.planning/` is tracked.

Push, pull request and branch changes happen only on the user's explicit request.

## Hand-off

After a single phase or a stop: "Run `/clear`, then `/crew:execute` for the next phase."
