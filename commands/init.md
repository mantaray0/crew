---
description: Set up crew's .planning/ state in the current project.
---

# /crew:init

Load the `crew-state` skill.

## Steps

1. **Existing `.planning/`** → nothing to scaffold; older crew state works as is. Report what is there; if `PROJECT.md` has no `## Checks`, offer to add one from the manifest. Stop.
2. **Detect** the stack and the test, typecheck and lint commands from the manifests (`package.json`, `composer.json`, `Makefile`, …).
3. **Ask**, batched, each with a recommendation:
   - `language.files` — recommend the global value, else the user's language.
   - Commit `.planning/` (recommended) or add it to `.gitignore`.
   - The `## Checks` commands as detected — confirm or correct.
   - One line on what the project is.
4. **Write:**
   - `config.json` with only the keys that differ from the global config (`{}` when none).
   - `PROJECT.md`: what it is, a stack table, `## Checks`, empty sections for decisions and current state.
   - `ROADMAP.md` with a title, `LOG.md` with `# Log`, empty `plans/` and `backlog/`.

## Hand-off

"Run `/clear`, then `/crew:brief` for the first idea — or `/crew:plan` if the work is already clear."
