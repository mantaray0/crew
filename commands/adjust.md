---
description: Change the roadmap mid-flight — insert, reorder, defer, or drop phases — and triage backlog items into it. No renumbering pain.
argument-hint: "[what to change, free-form]"
---

# /crew:adjust

Keep the plan fluid. The roadmap is plain Markdown, so changing it is a text edit — not a renumbering event.

## Steps

1. **Read** `.planning/roadmap.md` and `.planning/backlog.md`.
2. **Understand the change.** Insert a new phase, reorder phases, defer a phase (`[~]`), drop a phase, or pull a backlog idea into the roadmap. Ask only if the intent is ambiguous.
3. **Apply.** Edit `roadmap.md` directly. Phases are identified by their text/heading, not by rigid numbers — keep labels stable and human-readable; do not force a global renumber. Preserve status markers and completion timestamps of untouched phases.
4. **Update dependencies.** If the change affects inter-phase dependencies (for parallel dispatch), update them in the affected `plans/<slug>.md` and the roadmap notes.
5. **Backlog triage.** If pulling from `backlog.md`, move the item into the roadmap (and create/extend its `plans/<slug>.md` Spec head if it needs planning) and remove it from the backlog.
6. **Confirm.** Show the updated roadmap and what changed. Do not implement here.

If an in-flight phase is claimed in `claims.json`, warn before reordering/dropping it.
