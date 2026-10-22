---
description: Show where the project stands — milestones, current and next phase, recent log, backlog.
---

# /crew:status

Load the `crew-state` skill. Without `.planning/`, point to `/crew:init` and stop.

## Steps

1. Report from `ROADMAP.md`: per live milestone the count of done, in-progress, open and deferred phases; the current phase and the next one.
2. Show the last five entries of `LOG.md`.
3. Show the backlog: item count and the top five titles by priority.
4. A milestone with every phase `[x]` or `[~]` that is still live → offer to close it (`crew-state` → Closing a milestone). Otherwise change nothing.
