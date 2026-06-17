---
description: Change the roadmap mid-flight — insert, reorder, defer, or drop phases — and triage backlog items into it. No renumbering pain.
argument-hint: "[what to change, free-form]"
---

# /crew:adjust

Keep the plan fluid. The roadmap is plain Markdown, so changing it is a text edit — not a renumbering event.

**Follow `crew-conventions`:** ask the change explicitly (what to insert/reorder/defer/drop = select; backlog items to pull in = multi-select); respond in the user's language.

## Steps

1. **Read** `.planning/ROADMAP.md` and the backlog item files `.planning/backlog/*.md` (one file per item — see `crew-context` → *The backlog*; there is no `BACKLOG.md`).
2. **Understand the change.** Insert a new phase, reorder phases, defer a phase (`[~]`), drop a phase, or pull a backlog idea into the roadmap. Ask only if the intent is ambiguous.
3. **Apply.** Edit `ROADMAP.md` directly. Phases are identified by their text/heading, not by rigid numbers — keep labels stable and human-readable; do not force a global renumber. Preserve status markers and completion timestamps of untouched phases. **If you reorder or insert *milestones*** (rare), rename the affected plan folders' number prefix (`plans/<n>_<slug>/`) to match the new milestone numbers, so folders keep sorting correctly.
4. **Update dependencies.** If the change affects inter-phase dependencies (for parallel dispatch), update them in the affected `plans/<n>_<milestone-slug>/<id>_<title>.md` and the roadmap notes.
5. **Backlog triage.** If pulling from a `backlog/*.md` item, move it into the roadmap (and create/extend its `plans/<n>_<milestone-slug>/_spec.md` — the milestone Spec — if it needs planning), **seeding from the item's frontmatter + Key Facts** (use the captured context; ask only the gaps). Then resolve its file per the lifecycle (`crew-context` → *The backlog*): **promoted** (now in the roadmap) → **remove the item file**; **queued for later** → keep the file and set its `status: planned`.
6. **Confirm.** Show the updated roadmap and what changed. Do not implement here.

If an in-flight phase is claimed in `claims.json`, warn before reordering/dropping it.
