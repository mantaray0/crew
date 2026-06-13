---
description: Close out a finished milestone — audit that all phases are done, summarize what shipped, update PROJECT.md, then archive it.
argument-hint: "[milestone slug, optional — defaults to the active/latest milestone]"
---

# /crew:complete-milestone

The richer milestone close-out: audit → summarize → archive. Uses the `crew-context`, `crew-planning`, and `crew-conventions` skills. Wraps `/crew:archive` (which is the mechanical move).

**Follow `crew-conventions`:** confirm before writing; respond in the user's language.

## Steps

1. **Pick the milestone.** Use the `$ARGUMENTS` slug if given; otherwise the active/latest milestone in `.planning/ROADMAP.md`.
2. **Audit.** Verify every phase is `[x]` or `[~]` (deferred). `[~]` is **non-blocking** — a consciously deferred phase does not hold up close-out (confirm once that it should carry into the next milestone). If any phase is still **open** (`[ ]`/`[>]`), list those and **stop** — finish them (`/crew:execute`) or defer them (`/crew:adjust`) first. This matches the `[~]`-as-not-blocking definition the `/crew:execute` boundary guard uses, so the two never disagree on "milestone done".
3. **Summarize.** Append a milestone summary to `.planning/LOG.md`: what shipped, key decisions, and (if `observability.trackCost`) the rolled-up token/cost.
4. **Update PROJECT.md.** Refresh "Aktueller Stand" to reflect the completed milestone; move any validated requirement/decision into the living context as appropriate.
5. **Archive.** Run the `/crew:archive` step (see `commands/archive.md`) for this milestone — move its roadmap section and `plans/<n>_<slug>/` into `.planning/archive/`, leaving the one-line pointer.

## Hand-off

End your reply **in the user's language**, confirming the milestone is closed and archived, and point to the next step for the following milestone: `/crew:plan` if it isn't broken into phases yet, otherwise `/crew:resume` → `/crew:execute`.
