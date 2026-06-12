# @mantaray0/crew

## 0.1.1

### Patch Changes

- [#3](https://github.com/mantaray0/crew/pull/3) [`f90c687`](https://github.com/mantaray0/crew/commit/f90c687ab22f15bca621f45e1bbf10257051d7b5) Thanks [@mantaray0](https://github.com/mantaray0)! - Expand the README into full project documentation: a per-command reference for all 16 commands (purpose, arguments, step-by-step behavior), tables of the 12 specialist agents and 9 skills, the four hooks, the committed `.planning/` directory layout, the layered `config.json` schema overview, a core-loop diagram, and a "concepts in depth" section. Adds a table of contents.

## 0.1.0

### Minor Changes

- [`f7502a2`](https://github.com/mantaray0/crew/commit/f7502a2c3f1c4385df461975c2c883dd4e95a89f) Thanks [@mantaray0](https://github.com/mantaray0)! - Initial Core Engine: a config-driven Claude Code harness. `crew init`/`crew setup`, the committed `.planning/` state model, a project-type/tag registry, the core loop (`/crew:brief|plan|next|adjust|backlog|resume`), the verify pipeline with specialist agents, config-driven model management, parallel dispatch with worktree isolation and intent-aware merge coordination, a local task provider, retro/self-learn, notifications, and reporting.

- [`6068590`](https://github.com/mantaray0/crew/commit/60685908c375dcc769f9cfd82d14bcf0e20c444a) Thanks [@mantaray0](https://github.com/mantaray0)! - Add a `crew-conventions` skill and wire every command to it: commands now walk the user through decisions step by step (single-select / multi-select / free-text), never silently applying defaults, and respond in the user's language while keeping repo content English. Also rename the starter archetype `saas-app` to `app`.

- [`8802f14`](https://github.com/mantaray0/crew/commit/8802f14a473dad1440235445fceb2d3782d450b1) Thanks [@mantaray0](https://github.com/mantaray0)! - Add a `monorepo` archetype (all tags), a `language.files` config option (the language crew writes project files in — `PROJECT.md`/`ROADMAP.md`/`LOG.md`/`BACKLOG.md`/`plans/` — asked at `/crew:setup` and `/crew:init`, default `en`), and a `/crew:init` choice to commit or gitignore `.planning/`. Establish the `.planning/` naming convention: UPPERCASE documents (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md`), lowercase data (`config.json`, `claims.json`) and directories (`plans/`, `sessions/`).

### Patch Changes

- [`f36bfeb`](https://github.com/mantaray0/crew/commit/f36bfeb117838debdf62e7eedc7a5f768792a848) Thanks [@mantaray0](https://github.com/mantaray0)! - Define a plan file naming convention: `plans/<id>-<kebab-title>.md` (e.g. `1.2-db-schema.md` for a roadmap phase, `LIN-42-realtime.md` for a pulled ticket). Sessions already follow `sessions/<worktree-id>/<ISO-timestamp>.md`. Also translate the leftover German plan-template labels to English.
