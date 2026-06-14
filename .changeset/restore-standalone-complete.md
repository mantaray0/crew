---
"@mantaray0/crew": minor
---

Restore the standalone `/crew:complete` command and make `/crew:finish` a clean orchestrator.

`/crew:finish` now delegates all three close-out steps (Ship → Learn → Complete) to their own
commands instead of folding Complete inline — the close-out logic lives in exactly one place
(`/crew:complete`: audit → summarize → update `PROJECT.md` → archive, wrapping `/crew:archive`).
`/crew:archive` now tolerates deferred `[~]` phases with a one-time confirmation, matching the
Complete audit threshold. Docs and command surface only — no config-schema change.
