---
"@mantaray0/crew": patch
---

Default-value changes and a leaner close-out surface — `/crew:finish` is now the single entry point
for the milestone close-out.

**New defaults (the first-run/reconcile interview still asks; these are just the recommended values):**

- `workflow.execute.loop` defaults to **`all`** (was `one`). A bare `/crew:execute` now works through
  the whole milestone's phases sequentially by default; `loop: one` keeps the one-phase-then-stop
  behavior, and `/crew:execute [phase id]` still runs exactly one named phase.
- `workflow.ship.run` defaults to **`ask`** (was `off`), matching `learn.run`/`complete.run`. The
  remote/prod boundary is unchanged: `config.git` (`autoPush`/`autoPR`) stays the sole git authority,
  so even an `ask`/`auto`/`smart` ship never pushes or PRs without approval.

**Removed commands — close-out lives only in `/crew:finish`:**

- `/crew:complete` and its deprecated alias `/crew:complete-milestone` are removed. The Complete
  close-out (audit → summarize → update `PROJECT.md` → archive, wrapping `/crew:archive`) now runs
  **inline** inside `/crew:finish`.
- The deprecated `/crew:retro` alias is removed; use `/crew:learn`.

`/crew:ship` and `/crew:learn` remain standalone commands. Docs, the `crew-config` schema, and the
`/crew:setup`/`/crew:init` interviews are synced to the new defaults and surface.
