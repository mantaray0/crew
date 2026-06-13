---
description: Turn a clarified brief into a roadmap (milestones → phases) and detailed plan files. Triage the backlog. Wait for approval before execution.
argument-hint: "[feature/plan slug, optional]"
---

# /crew:plan

Produce the executable plan from a brief. Uses the `crew-planning` and `crew-conventions` skills.

**Follow `crew-conventions`:** surface decisions as explicit questions (which backlog items to fold in = multi-select; approach choices = single-select), don't silently decide; respond in the user's language.

## Steps

1. **Read context.** Read `.planning/PROJECT.md`, the originating brief `.planning/plans/<slug>/_brief.md` Spec head (if any — see `crew-planning` file naming), `.planning/ROADMAP.md`, and `.planning/BACKLOG.md`. **Trust the Spec as locked intent** — plan *structure/sequencing*, do not re-clarify the what/why. If you hit a genuine **intent** gap (a missing requirement, an undecided goal), bounce it back to the brief ("this belongs in `/crew:brief`") instead of silently deciding it.
2. **Triage the backlog.** Surface backlog items relevant to this plan; ask the user which to fold in now vs. leave parked. Remove folded items from `BACKLOG.md`.
3. **Draft the roadmap.** Write/extend `.planning/ROADMAP.md` as milestones → phases using markers `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred. Keep phases independently mergeable. Record inter-phase **dependencies** (for later parallel dispatch).
4. **Write the plan.** For each phase, write a **numbered** plan file into the milestone folder `.planning/plans/<milestone-slug>/<id>-<kebab-title>.md` (the roadmap phase id, e.g. `1.2-db-schema.md`) with a **Spec** head (carried from the `_brief.md` brief or the source ticket) followed by a **Plan** body: affected files, tasks (Action / pattern to mirror / validation command), risks, and this phase's verify configuration. For a **new project**, create one `<milestone-slug>/` folder per roadmap milestone; for a **feature**, write into the brief's existing `<slug>/` folder. Follow `clarify.specArtifact`. Once a brief's phases are all captured, the `_brief.md` may be removed (it has become the numbered plans).
5. **Ground in the codebase.** Mirror existing patterns; reference real files. Use the relevant stack skills based on the project's `tags`.
6. **Present and wait.** Show the roadmap + plan summary and **wait for explicit approval**. Do not start implementation here — that is `/crew:execute` (or `/crew:dispatch` for parallel phases).

If a security-sensitive area appears (auth, payments, tokens), note it and recommend a security pass in verify — do not enable it automatically (`security.auto` stays false).

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:execute` to build the first phase — or `/crew:dispatch` to run independent phases in parallel.
