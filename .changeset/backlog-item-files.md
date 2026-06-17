---
"@mantaray0/crew": minor
---

Replace `BACKLOG.md` with a `backlog/` folder: one Markdown file per idea (frontmatter + a Key-Facts body). `/crew:backlog add` asks three skippable prompts (why · affected area · priority) and always produces a valid item — full or stub. `/crew:backlog list` now returns a deterministic, priority-sorted table of all items; promoted items leave the backlog, and there is no generated index file. `/crew:brief` and `/crew:plan` seed from an item's Key Facts on promote, asking only the gaps. A version-gated reconcile migration converts an existing `BACKLOG.md` into the new structure losslessly and removes the old file after confirmation.
