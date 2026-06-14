---
description: Initialize crew in the current project — pick a project type, capture the stack, and scaffold the committed .planning/ state.
---

# /crew:init

Set up `.planning/` for this project. Uses the `crew-config` skill (config schema + archetypes), `roast-me` for the stack interview, and `crew-conventions`.

**Follow `crew-conventions`:** walk step by step, ask each decision explicitly (archetype = single-select; tags = multi-select; stack values = free-text or confirm), never silently apply defaults, and respond in the user's language.

## Steps

1. **Detect the mode.** If `.planning/config.json` already exists, this is a **re-run → reconcile mode**, *not* a re-scaffold: bring the project config up to date with the installed plugin (see `crew-config` → **Config versioning & migration**). Read the current plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`; schema-diff the existing `config.json` (classify keys new / removed / unchanged); **first apply the known migrations** from `crew-config` → **Known migrations** (the M4 section renames plus the M5 moves into `config.workflow.*` — e.g. `ship`→`workflow.ship`, `retro`→`workflow.learn`, `verify`→`workflow.execute.verify`, `finish.*`→step `run`s) so renamed/split/moved keys keep their value; **ask per new field** using its purpose + recommended default from the `crew-config` schema (single-select for enums like `responseStyle` and the new `workflow.mode`/`run` gates, free-text for open values); offer to drop removed keys (`loop`/`state`/`brief.askOnlyWhenStuck`); then stamp `crewVersion` to the current plugin version. **Also offer to migrate the plans layout:** legacy flat files in `plans/` (`_<slug>.md` briefs and bare `<id>_…md` phase plans) predate the numbered-milestone-folder structure — offer to move each into its `plans/<n>_<milestone-slug>/` folder (number-prefixed by milestone; brief → `_spec.md`; see `crew-planning`). A pure `mv`, no content change. Do **not** overwrite `PROJECT.md` / `ROADMAP.md` / `LOG.md` or re-run the archetype interview. Skip the steps below. — Otherwise (`.planning/` absent), continue with the first-run scaffold.
2. **Pick a project type.** Read the global registry `~/.claude/crew/project-types.json` if present, else use the starter archetypes documented in the `crew-config` skill. Ask the user to pick one (`app` / `api-service` / `cli` / `marketing-site` / …) or "decide later". Seed `tags`, `stack`, and `testing.policy` from the chosen archetype.
3. **Stack interview.** Confirm or adjust DB / frontend / UI / backend-API / queue / deploy — pre-filled from the archetype and the user's defaults. Offer the escape "you decide → I propose → you approve".
4. **File language.** Single-select: which language should crew write this project's files in (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md`, `plans/`)? Options: **English** (default) · **the user's language** · **inherit the global** `config.language.files`. Store the choice in `config.language.files`.
5. **Roast level (`workflow.brief.intensity`).** Single-select: how hard should Roast-Me challenge ideas during `/crew:brief` — `gentle` · `normal` (default) · `brutal` · **inherit the global** `config.workflow.brief.intensity`. Store the choice in `config.workflow.brief.intensity`.
6. **Deploy / release interview (`config.workflow.ship` + runbook).** Single-select `enabled` — **on** (default) · off · **inherit the global**. If enabled, ask each (recommended default shown; `inherit the global` always an option):
   - `provider` — `gh-actions` / `gitlab-ci`.
   - `releaseTool` — `auto` (default; pre-fill the value **detected** from the repo per `crew-deploy` → Release mechanics) · `changesets` · `release-please` · `semantic-release` · `manual` · `none`.
   - `runDeploy` — `off` (default — push-triggered CI, the push *is* the deploy) · `ask` · `auto`.
   - `finishRelease` — `off` (default) / `ask` / `auto` — **only ask when** the resolved `releaseTool` is a bot-PR tool (`changesets`/`release-please`).
   Store all in `config.workflow.ship`. Then **actively create `reference/deploy.md`**: interview the concrete procedure — release strategy, branch/tag conventions, environments, secrets *policy* (pointers, never values), rollback, and (when `runDeploy ≠ off`) the deploy command(s) — write the runbook and index it one line under `PROJECT.md`'s `## Reference`.
7. **Workflow gates (`config.workflow`).** Ask the workflow-gate group so the two-level model isn't silently defaulted (`crew-conventions`). **Batch these independent questions in an `AskUserQuestion` stepper**; each single-select shows its default and always offers **inherit the global** (project overrides global per field; leave a field out to inherit). Fields:
   - `workflow.mode` — `manual` (default) · `auto` · inherit global — does the step chain advance between steps (execute → ship → learn → complete)?
   - `workflow.ship.run` — `off` (default) · `ask` · `auto` · `smart` · inherit global — the ship close-out gate (orthogonal to `ship.enabled` above; `config.git` still authorizes every push/PR).
   - `workflow.learn.run` — `off` · `ask` (default) · `auto` · `smart` · inherit global.
   - `workflow.complete.run` — `off` · `ask` (default) · `auto` · `smart` · inherit global.
   - `workflow.execute.loop` — `one` (default) · `all` · inherit global — the phase loop; and `workflow.execute.parallel` — `auto` (default) · `manual` · `off` · inherit global — the execution strategy.

   Write only overridden values into `config.workflow.*`; **inherit-global / default → leave the field out** so it inherits at runtime through the `defaults < global < project` layering.
8. **Commit or ignore `.planning/`.** Single-select: **commit** `.planning/` (recommended — shareable, part of project history, readable by PM integrations) or **gitignore** it (local-only)? If **gitignore**, add a `.planning/` line to the project's `.gitignore` (create the file if missing). If **commit**, make sure `.planning/` is not ignored.
9. **Scaffold `.planning/`:**
   - `config.json` — the full default config from the `crew-config` skill, with `projectType`, `tags`, `stack`, `testing.policy`, `language.files`, `responseStyle`, `workflow.brief.intensity`, `workflow.ship`, and any overridden `workflow` gates (`mode`/`ship.run`/`learn.run`/`complete.run`/`execute.loop`/`execute.parallel`) seeded, plus `crewVersion` set to the current plugin version (from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
   - `PROJECT.md` — architecture decisions (the *why*), current state, constraints, and a stack table **mirrored from `config.stack`** (the source of truth) — written in `config.language.files`.
   - `ROADMAP.md` — an empty first milestone.
   - `LOG.md`, `BACKLOG.md`, `claims.json` (`{}`), and an empty `plans/` directory.
10. **Confirm** and point to `/crew:brief` (new feature) or `/crew:plan`.

Write the files with your file tools — deterministic content, no guessing. Keep `config.json` complete so behavior is fully config-driven from the start.

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:brief` to clarify your first idea — or `/crew:plan` if the work is already clear.
