---
"@mantaray0/crew": minor
---

Unify execution under `/crew:execute`: add `auto` (sequential autonomous milestone run) and `dispatch [ids]` (parallel worktree run) as space-argument modes, and dissolve the standalone `/crew:dispatch` command (its DAG/wave/rolling-integration mechanics move into `dispatch` mode; `git-merge` stays the source of truth). `auto` is the manual mode automated — no sub-agents: it runs the normal one-phase steps, then triggers `/clear` + `/crew:execute auto` under the hood so each phase starts in a fresh context, with continuity carried by `.planning/` state. Both autonomous modes share one contract: loop, stop-and-ask on real deviations/critical findings, full verify per phase, never self-ship/-complete. All command-path references rewired to `/crew:execute dispatch`.
