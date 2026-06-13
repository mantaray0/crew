---
"@mantaray0/crew": minor
---

Rework deploy config. `config.deploy.mode` (off/orchestrate/execute) is replaced by `enabled` (is `/crew:ship` available?) + `runDeploy` (off/ask/auto — run an imperative deploy command?). `config.git` is now the single git authority for ship — there is no separate deploy push axis, so the prod-triggering push belongs to `git.autoPush` (the user). The deploy runbook moves from the dedicated `DEPLOY.md` to the generic `reference/deploy.md`. `config.stack` is the single source of truth for stack facts; `PROJECT.md` mirrors it. Existing configs auto-migrate at `/crew:init` (or `/crew:setup`) reconcile: `off → enabled:false`, `orchestrate → runDeploy:off`, `execute → runDeploy:ask`.
