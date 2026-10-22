---
description: Orient a fresh session from .planning/ — what was done, what is open, the next step — then wait.
---

# /crew:resume

Load the `crew-state` skill.

## Steps

1. **Read** `PROJECT.md` (for a long one: its headings plus the current-state section), the active milestone in `ROADMAP.md` with its `_spec.md`, the last ~30 lines of `LOG.md`, and the bodies of the last few phase commits (`git log`), which carry rejected findings and deviations. Also read any handoff note `.planning/` holds.
2. **Brief** the user:
   - **Project** — two sentences.
   - **State** — done, in progress, open in the active milestone.
   - **Do not retry** — approaches that failed or were rejected, with the reason; "none" if none.
   - **Next step** — the `[>]` phase, else the next open one, else a proposal.
   - Missing files the state refers to.
3. **Wait.** On "continue", run `/crew:execute`.
