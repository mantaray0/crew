---
"@mantaray0/crew": major
---

crew 1.0 is a slim planning plugin: it keeps `.planning/` across sessions and runs each phase in a fresh `crew:executor`.

- **Kept:** `init`, `brief`, `plan`, `adjust`, `backlog`, `execute`, `status`, `resume`. Closing a milestone is a step in `execute` and `status`.
- **Removed commands:** `ship`, `finish`, `learn`, `complete`, `archive`, `rollback`, `report`, `pull`, `update`, `setup`, `verify`, `quick`, and `execute dispatch` (parallel worktrees).
- **Removed agents:** all review, hardening and simplify agents, `architect`, `code-explorer`, `build-error-resolver`, `merge-coordinator`. `executor` is the only agent.
- **Removed skills:** `verify`, `git-merge`, `deploy`, `learn`, `model-management`; `crew-context`, `planning`, `crew-config` and `crew-conventions` are merged into `crew-state`.
- **Verify per phase:** the checks from `PROJECT.md` (`## Checks`, else the `test`/`typecheck`/`lint` scripts), then Claude Code's built-in `/code-review` (`workflow.execute.review`, default `medium`). Each finding is fixed or rejected with a one-sentence reason. Checks and review run in the foreground; the executor hands back only with commit, ROADMAP stamp and LOG line.
- **roast-me** asks in rounds, each question with a recommended answer; `brief.intensity` and `brief.depth` are gone.
- **Config:** only `language.files`, `workflow.execute.loop` and `workflow.execute.review` are read. At session start crew rewrites the global and the project config down to these keys (dropping `"inherit"` values) and retires `~/.claude/crew/project-types.json`; originals are kept in `~/.claude/crew/backup/`. Commit format, branches and tracker come from the project's `CLAUDE.md`.
- **LOG.md:** one line per phase (date, phase, commit, verify result). Existing entries stay untouched.
- **Hooks:** SessionStart prints the active milestone and next phase instead of `PROJECT.md`; the Notification and Stop hooks are removed.

Existing `.planning/` content (ROADMAP, plans, LOG, backlog) is read as is; only `config.json` is cleaned.
