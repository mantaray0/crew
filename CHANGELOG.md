# @mantaray0/crew

## 0.12.0

### Minor Changes

- [`b12e375`](https://github.com/mantaray0/crew/commit/b12e375a5ae9e24c2b1dc520dce6fcfe27dac437) Thanks [@mantaray0](https://github.com/mantaray0)! - Co-locate the archived roadmap inside its milestone folder.

  Archiving a milestone now writes its former ROADMAP section into the moved folder as
  `archive/plans/<n>_<slug>/_roadmap.md` (beside `_spec.md` and the phase plans) instead of a flat
  `archive/roadmap-<n>_<slug>.md` file next to it — one milestone = one folder, consistent with the
  `_spec.md` meta-file idiom. The "file kinds" convention is generalized so that a leading underscore
  marks a meta file (never a phase), covering `_spec.md`, `_roadmap.md`, and future `_*.md`. Existing
  flat archives stay as-is (the new layout applies from now on).

## 0.11.0

### Minor Changes

- [#22](https://github.com/mantaray0/crew/pull/22) [`4e1c197`](https://github.com/mantaray0/crew/commit/4e1c197fe85f30ec6770f82acf0f6ff7ea7312c6) Thanks [@mantaray0](https://github.com/mantaray0)! - `/crew:backlog list` can now promote an item straight into work — a "do it now" triage action routes it by size (small → `/crew:quick` with no roadmap entry, feature → `/crew:brief`/`/crew:plan`, roadmap-worthy → `/crew:adjust`). Adds a routing rule of thumb and removes the promoted item from the backlog. Closes the gap between "captured" and "in work" without a mandatory roadmap detour.

- [#22](https://github.com/mantaray0/crew/pull/22) [`4e1c197`](https://github.com/mantaray0/crew/commit/4e1c197fe85f30ec6770f82acf0f6ff7ea7312c6) Thanks [@mantaray0](https://github.com/mantaray0)! - `/crew:execute` (one-phase default) now has milestone-boundary awareness. When the next phase belongs to a new milestone and the previous one is fully done, it pauses and offers `/crew:complete-milestone` (audit → summary → archive) instead of silently gliding across the boundary — the same awareness `auto`/`dispatch` already have. It only offers; it never self-completes. When the active milestone is done and the next is unplanned, it routes to `/crew:plan`/`/crew:resume` instead of asking vaguely.

### Patch Changes

- [#22](https://github.com/mantaray0/crew/pull/22) [`4e1c197`](https://github.com/mantaray0/crew/commit/4e1c197fe85f30ec6770f82acf0f6ff7ea7312c6) Thanks [@mantaray0](https://github.com/mantaray0)! - Clarify the `/crew:status` vs `/crew:resume` distinction in both command docs (`status` = any-time read-only dashboard; `resume` = session bootstrap that reads the session snapshot — DO NOT RETRY + the exact next step). Fix a dead `/crew:new` reference in `/crew:complete-milestone`'s hand-off (now points to real verbs). Align `/crew:complete-milestone`'s audit so `[~]` deferred phases are non-blocking for close-out, consistent with the `/crew:execute` boundary guard.

## 0.10.0

### Minor Changes

- [#20](https://github.com/mantaray0/crew/pull/20) [`072ea53`](https://github.com/mantaray0/crew/commit/072ea53cb2107a8d6416ce7e3139d514f4e98999) Thanks [@mantaray0](https://github.com/mantaray0)! - Use the underscore number↔name separator for phase and ticket plan files too

  Completes the separator unification started in 0.9.0 (milestone folders). Phase and ticket plan files now join their id to the title with an underscore — `<id>_<title>.md` (e.g. `1.2_db-schema.md`, `LIN-42_realtime-notifications.md`) instead of `<id>-<title>.md`. With this, every crew name follows one rule: `_` separates a number/id from its kebab name, `.` is reserved for the phase hierarchy inside an id (`1.2` = phase 2 of milestone 1), and `-` is reserved for the words inside a kebab name.

  Existing projects: rename phase files manually (`<id>-<title>.md` → `<id>_<title>.md`); `/crew:init` reconcile offers the plans-layout migration. Reads are unaffected — commands glob `plans/**/*.md` and match phases by id, not by exact filename.

## 0.9.0

### Minor Changes

- [`155d9f2`](https://github.com/mantaray0/crew/commit/155d9f286dbff97090906e72f040adc926a413ae) Thanks [@mantaray0](https://github.com/mantaray0)! - Number milestone plan folders as `<n>_<slug>`

  Milestone plan folders are now prefixed with the milestone number using an underscore separator (e.g. `plans/1_fundament/`) so they sort correctly and reveal which milestone they belong to while collapsed. The underscore keeps the number↔name separator distinct from the dot used for phase ids (`1.2` = phase 2 of milestone 1) and the hyphen used in the kebab slug. Phase plan files are unchanged (`<id>-<title>.md`, e.g. `1.2-db-schema.md`).

  Existing projects: rename folders manually (`<slug>/` → `<n>_<slug>/`); no automatic migration prompt was added.

## 0.8.0

### Minor Changes

- [`7443456`](https://github.com/mantaray0/crew/commit/7443456348d6fdfba016c32a851ab2e30948aaec) Thanks [@mantaray0](https://github.com/mantaray0)! - Add `/crew:update` — a dedicated, findable entry point for the config reconcile that previously hid inside the re-run modes of `/crew:init` and `/crew:setup`. Covers project and (when present) global config; delegates to the `crew-config` reconcile procedure instead of duplicating it.

- [`3663b44`](https://github.com/mantaray0/crew/commit/3663b4491eae6fb4dca5b5cda132fba1343cb290) Thanks [@mantaray0](https://github.com/mantaray0)! - Parametrize `/crew:backlog` per the command-naming convention: `add` is now the default verb. `/crew:backlog <text>` adds directly (unchanged), `list` lists and triages (the former bare-call behavior, now explicit), `new` is an alias for the add flow, and a bare `/crew:backlog` now prompts for the idea and adds it. `argument-hint` and description updated to match.

- [`ad63d56`](https://github.com/mantaray0/crew/commit/ad63d566afe589a075e3ca26b6588a02c029a668) Thanks [@mantaray0](https://github.com/mantaray0)! - Show a compact backlog section in `/crew:status` — item count plus the first few titles from `.planning/BACKLOG.md`, with an overflow pointer to `/crew:backlog list`. Keeps parked ideas visible alongside the roadmap while staying read-only.

- [`353113b`](https://github.com/mantaray0/crew/commit/353113b6110ac7aac6864b2fb94ae3f5e9d97cf2) Thanks [@mantaray0](https://github.com/mantaray0)! - Unify execution under `/crew:execute`: add `auto` (sequential autonomous milestone run) and `dispatch [ids]` (parallel worktree run) as space-argument modes, and dissolve the standalone `/crew:dispatch` command (its DAG/wave/rolling-integration mechanics move into `dispatch` mode; `git-merge` stays the source of truth). `auto` is the manual mode automated — no sub-agents: it runs the normal one-phase steps, then triggers `/clear` + `/crew:execute auto` under the hood so each phase starts in a fresh context, with continuity carried by `.planning/` state. Both autonomous modes share one contract: loop, stop-and-ask on real deviations/critical findings, full verify per phase, never self-ship/-complete. All command-path references rewired to `/crew:execute dispatch`.

### Patch Changes

- [`b50e595`](https://github.com/mantaray0/crew/commit/b50e595c0d612ca94159299bcb71560381933eec) Thanks [@mantaray0](https://github.com/mantaray0)! - Document the command naming convention in the crew-conventions skill: one command per verb, variants as space-arguments, hyphenated files only as thin alias wrappers.

- [`7ef32eb`](https://github.com/mantaray0/crew/commit/7ef32eb11763e0220fdd0b3ffd051b8e4f90fc98) Thanks [@mantaray0](https://github.com/mantaray0)! - Default `deploy.finishRelease` to `off` so new scaffolds never auto-merge a bot version-PR; existing configs are untouched (reconcile never writes a changed default over a set value).

- [`7b55ac9`](https://github.com/mantaray0/crew/commit/7b55ac97c394a21d19a6492d1ce1f5ed9a97b1d6) Thanks [@mantaray0](https://github.com/mantaray0)! - Sync the README command catalog and shared references with the unified command surface: `/crew:dispatch` is gone everywhere in favor of `/crew:execute dispatch` (now documented alongside the `auto` mode), `/crew:update` is listed, `/crew:backlog` shows its new `[idea | list | new | empty]` args, and the `finishRelease` default reads `off`. The session-start config-drift notice now points at `/crew:update` (was `/crew:init`).

## 0.7.0

### Minor Changes

- [`d39bd3a`](https://github.com/mantaray0/crew/commit/d39bd3af15e02c8ea1126aab16b40c6563f3a3cc) Thanks [@mantaray0](https://github.com/mantaray0)! - Add release-mechanics awareness to deploy. New `config.deploy.releaseTool` (`auto`/`changesets`/`release-please`/`semantic-release`/`manual`/`none`) replaces ship's hardcoded Changesets detection — ship now branches its version/commit/tag steps by the tool (local bump vs. push-only vs. CI-autonomous). New `config.deploy.finishRelease` (`off`/`ask`/`auto`, default `ask`) lets ship merge an open bot version-PR to finish the release (changesets/release-please only). `/crew:init` now runs an active deploy/release interview that feeds these axes and creates the `reference/deploy.md` runbook; `/crew:setup` captures the global defaults. Additive — existing configs gain the new fields with defaults at reconcile.

## 0.6.0

### Minor Changes

- [`6e86ba0`](https://github.com/mantaray0/crew/commit/6e86ba067bfd001a12d977c0fa1e1d5432a01f26) Thanks [@mantaray0](https://github.com/mantaray0)! - Rework deploy config. `config.deploy.mode` (off/orchestrate/execute) is replaced by `enabled` (is `/crew:ship` available?) + `runDeploy` (off/ask/auto — run an imperative deploy command?). `config.git` is now the single git authority for ship — there is no separate deploy push axis, so the prod-triggering push belongs to `git.autoPush` (the user). The deploy runbook moves from the dedicated `DEPLOY.md` to the generic `reference/deploy.md`. `config.stack` is the single source of truth for stack facts; `PROJECT.md` mirrors it. Existing configs auto-migrate at `/crew:init` (or `/crew:setup`) reconcile: `off → enabled:false`, `orchestrate → runDeploy:off`, `execute → runDeploy:ask`.

## 0.5.0

### Minor Changes

- [#14](https://github.com/mantaray0/crew/pull/14) [`075eca3`](https://github.com/mantaray0/crew/commit/075eca386bba205ec9662133a59da901530b579b) Thanks [@mantaray0](https://github.com/mantaray0)! - Add the `.planning/reference/` convention — load-on-demand knowledge docs (runbooks, domain maps, architecture deep-dives) that never auto-load. Each is indexed one line in `PROJECT.md`'s `## Reference` section (link + what it covers + when to read), keeping the standing context small; docs open with a `**Reference ·** … **Read when:** …` header. Documented in `crew-context`.

## 0.4.0

### Minor Changes

- [#12](https://github.com/mantaray0/crew/pull/12) [`6cae535`](https://github.com/mantaray0/crew/commit/6cae5354b8c14ae64508f95a4651e7b64c0609c5) Thanks [@mantaray0](https://github.com/mantaray0)! - Brief/Planning refinement: configurable roast level (`clarify.intensity`: gentle/normal/brutal), batched inline-stepper clarification with a Spec-Probe stop, sharpened brief↔plan boundary (locked spec + intent bounce-back), and milestone-folder structure for `plans/` (`plans/<milestone-slug>/_brief.md` + numbered phase plans).

- [#12](https://github.com/mantaray0/crew/pull/12) [`6cae535`](https://github.com/mantaray0/crew/commit/6cae5354b8c14ae64508f95a4651e7b64c0609c5) Thanks [@mantaray0](https://github.com/mantaray0)! - Deploy/Release + roadmap archiving. New `config.deploy` (`mode`: off/orchestrate/execute, `provider`: gh-actions/gitlab-ci) and a `/crew:ship` command that drives version → commit → tag → push → PR → deploy, **bounded by `config.git`** (never pushes/PRs/commits in a way your git config disables). New `crew-deploy` skill and `.planning/DEPLOY.md` artifact. New `/crew:archive` and `/crew:complete-milestone` move finished milestones into `.planning/archive/` to keep the live roadmap small. CI-workflow scaffolding is intentionally out of this MVP.

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
