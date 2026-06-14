---
description: Close out a finished milestone — audit that all phases are done, summarize what shipped, update PROJECT.md, then archive it.
argument-hint: "[milestone slug, optional — defaults to the active/latest milestone]"
---

# /crew:complete

The milestone close-out: take a finished milestone from "phases done" to "archived and recorded" —
**audit → summarize → update `PROJECT.md` → archive**. Uses the `crew-conventions`, `crew-context`,
`crew-planning`, and `crew-config` skills.

As the **Complete step** of the `/crew:finish` close-out strand its gate is `config.workflow.complete.run`
(`off|ask|auto|smart`); invoked directly it always runs and applies the canonical **Catch-up rule**
(`crew-conventions`) — offer any missing earlier close-out step (`ship`, `learn`) per its `run`.

**Complete ⊃ Archive.** Complete is the full *semantic* close-out (audit + summary + `PROJECT.md` +
archive); `/crew:archive` is the mechanical primitive it calls as its last step. Archive stays usable on
its own for pure tidy-up (e.g. old milestones that never ran through finish). They are **not** aliases of
each other — Complete wraps Archive, not the reverse.

**Follow `crew-conventions`:** surface each decision explicitly; respond in the user's language.

## Steps (audit → summarize → PROJECT.md → archive)

1. **Audit.** Pick the milestone from `$ARGUMENTS` (slug, optional) or the active/latest one in
   `.planning/ROADMAP.md`. Every phase must be `[x]` **or** `[~]` (deferred phases are **non-blocking**,
   matching the `/crew:execute` boundary guard; confirm once whether a `[~]` should carry into the next
   milestone). If a phase is still open (`[ ]`/`[>]`), this is a **blocked** outcome, not a skip — log
   `stopped: complete — open phases <list>`, point the user at `/crew:execute`/`/crew:adjust` to resolve
   them, and **stop**. Never pretend a milestone closed over open phases.
2. **Summarize.** Append a milestone summary to `.planning/LOG.md`: what shipped, the key decisions, and
   a rolled-up token/cost note when `config.observability.trackCost`.
3. **Update `PROJECT.md`.** Refresh the current-state section for the completed milestone.
4. **Archive.** Run the `/crew:archive` step (`commands/archive.md`) as the final step — **delegate, do
   not duplicate**: it moves the milestone's `plans/<n>_<slug>/` and its `ROADMAP.md` section into
   `.planning/archive/`, leaving the one-line pointer.

## Hand-off

End your reply **in the user's language**, confirming the milestone is audited, summarized, and archived,
then point to `/crew:plan` (or `/crew:brief`) for the next milestone. If the audit stopped on open phases,
point to `/crew:execute`/`/crew:adjust` instead.
