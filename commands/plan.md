---
description: Turn a clarified brief into a roadmap (milestones → phases) and detailed plan files. Triage the backlog. Wait for approval before execution.
argument-hint: "[feature/plan slug, optional]"
---

# /crew:plan

Produce the executable plan from a brief. Uses the `planning` and `crew-conventions` skills.

**Follow `crew-conventions`:** surface decisions as explicit questions (which backlog items to fold in = multi-select; approach choices = single-select), don't silently decide; respond in the user's language.

## Steps

1. **Read context.** Read `.planning/PROJECT.md`, the originating brief `.planning/plans/<n>_<slug>/_spec.md` — the milestone Spec (if any — see `planning` file naming), `.planning/ROADMAP.md`, and the backlog item files `.planning/backlog/*.md` (one file per item — see `crew-context` → *The backlog*; there is no `BACKLOG.md`). **Trust the Spec as locked intent** — plan *structure/sequencing*, do not re-clarify the what/why. If you hit a genuine **intent** gap (a missing requirement, an undecided goal), bounce it back to the brief ("this belongs in `/crew:brief`") instead of silently deciding it.
2. **Triage the backlog.** Surface backlog items relevant to this plan (from each item's frontmatter `title`/`priority`/`description`); ask the user which to fold in now vs. leave parked (multi-select). **When folding an item, read its frontmatter + Key Facts and *seed* the plan from them** (pick up the captured motivation / constraints / affected area) — then clarify only the **remaining gaps**, don't re-ask cold (the handoff contract, `crew-context` → *The backlog*). Remove each folded item's file (a promoted item is retired from the backlog — `crew-context` lifecycle); leave parked items untouched.
3. **Draft the roadmap.** Write/extend `.planning/ROADMAP.md` as milestones → phases using markers `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred. Keep phases independently mergeable. Record inter-phase **dependencies** (for later parallel dispatch).
4. **Write the plan.** For each phase, write a **numbered** plan file into the numbered milestone folder `.planning/plans/<n>_<milestone-slug>/<id>_<kebab-title>.md` (folder prefixed with the milestone number `<n>`; file named by the roadmap phase id, e.g. `1_fundament/1.2_db-schema.md`). Each phase file carries a short **Scope of this phase** note (1–3 lines: the deliverable + this phase's own acceptance) that **references `_spec.md`** for the full intent, followed by the **Plan** body: affected files, tasks (Action / pattern to mirror / validation command), risks, and this phase's verify configuration. Do **not** copy a full `## Spec` head into the phase file — `_spec.md` is the single, permanent source of intent (the milestone Spec stays; it is never folded into the phase plans). For a **new project**, create one `<n>_<milestone-slug>/` folder per roadmap milestone; for a **feature**, write into the brief's existing `<n>_<slug>/` folder.
5. **Ground in the codebase.** Mirror existing patterns; reference real files. Use the relevant stack skills based on the project's `tags`.
6. **Present and wait.** Show the roadmap + plan summary and **wait for explicit approval**. Do not start implementation here — that is `/crew:execute` (or `/crew:execute dispatch` for parallel phases).

If a security-sensitive area appears (auth, payments, tokens), note it and recommend a security pass in verify — do not enable it automatically (`security.auto` stays false).

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:execute` to build the first phase — or `/crew:execute dispatch` to run independent phases in parallel.
