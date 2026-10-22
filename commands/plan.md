---
description: Cut a brief into roadmap phases with one plan file per phase, triage the backlog, and wait for approval.
argument-hint: "[milestone or slug]"
---

# /crew:plan

Load the `crew-state` skill. This command decides the how; the what is settled in the brief.

## Steps

1. **Read** `PROJECT.md`, `ROADMAP.md`, the backlog, and the milestone's `_spec.md` (named in `$ARGUMENTS`, else the newest without phases; a new project plans from `PROJECT.md`). An intent gap — a missing requirement or goal — goes back to `/crew:brief`. Decide every `Notes for planning` item: fold it in or drop it with a reason.
2. **Backlog.** Offer the items relevant to this milestone (multi-select). A folded item seeds the plan with its Why; delete its file once the plan is written.
3. **Ground in the code.** Read what the phases will touch and name real files and patterns to mirror; for wide terrain, send an Explore sub-agent.
4. **Cut phases.** Each phase is one commit that the `## Checks` can verify, with its `depends:`. Its Risks name what a reviewer must not trade away.
5. **Show** the roadmap section and a summary per phase; adjust until the user approves.
6. **Write** in `language.files`: the `ROADMAP.md` section (title, one-line hook, phases) and one plan file per phase in `plans/<n>_<slug>/`.

## Hand-off

"Run `/clear`, then `/crew:execute`."
