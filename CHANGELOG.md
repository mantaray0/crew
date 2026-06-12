# @mantaray0/crew

## 0.3.1

### Patch Changes

- [#10](https://github.com/mantaray0/crew/pull/10) [`385628b`](https://github.com/mantaray0/crew/commit/385628beb01cb3e4b7e5a83a54cb62f469e3741d) Thanks [@mantaray0](https://github.com/mantaray0)! - Documentation/flow follow-ups for the brief-naming change: note the `_<slug>.md` brief convention in the design spec, and have `/crew:init` reconcile mode offer to rename legacy un-prefixed briefs in `plans/` to the `_<slug>.md` form.

## 0.3.0

### Minor Changes

- [#8](https://github.com/mantaray0/crew/pull/8) [`b7f3152`](https://github.com/mantaray0/crew/commit/b7f3152b93c73fbb9143e9ee4fc7451b717256b2) Thanks [@mantaray0](https://github.com/mantaray0)! - Three related additions:

  - **Config versioning & reconcile.** New `crewVersion` config field records the plugin version a config was last reconciled with. Re-running `/crew:setup` (global) or `/crew:init` (project) now enters a **reconcile mode** instead of re-scaffolding: it schema-diffs the existing config against the current `crew-config` schema and **asks about each new field** (with its purpose and recommended default) rather than silently applying defaults, then stamps `crewVersion`. The `session-start` hook warns once when a project's config is behind the installed plugin.
  - **`responseStyle` option** (global + project override): `concise` (default — short, tables for comparisons/findings), `detailed` (full prose), or `auto`. Enforced by `crew-conventions` for every command reply; it changes format/length only, never the one-decision-at-a-time interaction flow.
  - **Brief file naming.** `/crew:brief` now writes the un-numbered initiative spec as `_<slug>.md` (underscore-prefixed) so briefs are visually distinct from numbered phase plans (`<id>-<title>.md`) in `plans/`. `/crew:plan` reads the `_<slug>.md` brief and produces the numbered phase plans.

## 0.2.0

### Minor Changes

- [#5](https://github.com/mantaray0/crew/pull/5) [`ed5b1fe`](https://github.com/mantaray0/crew/commit/ed5b1fe73fd6fc43a8d150df1bf89643f212b826) Thanks [@mantaray0](https://github.com/mantaray0)! - Rename `/crew:next` to `/crew:execute` (no alias — `/crew:next` no longer exists) so the core execution command reads unambiguously, and update every cross-reference in commands, skills, the README, and the design spec. Add a **Hand-off** section to the main-chain commands (`setup`, `init`, `brief`, `plan`, `execute`, `pull`, `retro`): each now ends by prompting the user, in their language, to `/clear` the context and run the next logical command.

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
