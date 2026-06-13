---
"@mantaray0/crew": minor
---

`/crew:execute` (one-phase default) now has milestone-boundary awareness. When the next phase belongs to a new milestone and the previous one is fully done, it pauses and offers `/crew:complete-milestone` (audit → summary → archive) instead of silently gliding across the boundary — the same awareness `auto`/`dispatch` already have. It only offers; it never self-completes. When the active milestone is done and the next is unplanned, it routes to `/crew:plan`/`/crew:resume` instead of asking vaguely.
