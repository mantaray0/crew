---
description: One-time global crew setup — define your project types and tags and write the global config/registry under ~/.claude/crew/.
---

# /crew:setup

Establish the global layer that applies across all your projects. Uses the `crew-config` and `crew-conventions` skills.

**Follow `crew-conventions`:** walk this step by step, ask each decision as an explicit question (free-text / single-select / multi-select), never silently apply defaults (present them as the recommended choice), and respond in the user's language.

## Steps

1. **Ensure** `~/.claude/crew/` exists, then **detect the mode.** If `~/.claude/crew/config.json` (or `project-types.json`) already exists, this is a **re-run → reconcile mode** (go to *Reconcile*). Otherwise it's a **first run** (go to *First run*).

### Reconcile (config already exists)

Bring the existing global config up to date with the installed plugin — see `crew-config` → **Config versioning & migration**.

1. **Read** the current plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` and the existing `~/.claude/crew/config.json` (its `crewVersion`).
2. **Schema-diff** the existing config against the `crew-config` schema: first apply the **Known migrations** from `crew-config` (e.g. `deploy.mode` → `enabled`/`runDeploy`) so renamed/split keys keep their value, then classify each remaining key as **new** (in schema, missing here), **removed** (here, gone from schema), or unchanged. Report the diff compactly.
3. **Ask per new field.** For each new key, show its purpose + recommended default (from the `crew-config` schema) and ask the user what they want — single-select for enums (e.g. `responseStyle`), free-text for open values. Never silently apply a default.
4. **Flag removed fields** and offer to drop them.
5. **Stamp** `crewVersion` to the current plugin version and save. Optionally offer to revisit the registry/config groups below.

### First run (no config yet)

1. **Registry (`project-types.json`).** Show the starter archetypes + tags from the `crew-config` skill. Ask, as explicit questions, whether to add / rename / remove any archetype or tag (a multi-select of "keep as-is vs adjust", then free-text for the adjustments). Only write after the user confirms the final set.
2. **Global `config.json`.** Decide whether to write one at all (single-select). If yes, go through the config groups (`models`, `git`, `deploy`, `notifications`, `tasks.provider`, `execution`, `language.files`, `responseStyle`, `clarify`, …) **one at a time** — for each, single-select "keep default vs override", and on override ask the specific value (select / free-text). For `language.files`, ask which language the project files crew generates (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, plans) should be written in (default `en`). For `responseStyle`, single-select `concise` (default) / `detailed` / `auto`. For `clarify.intensity`, single-select `gentle` / `normal` (default) / `brutal` — how hard Roast-Me challenges an idea during `/crew:brief`. For `config.deploy`, single-select `enabled` (on (default) / off); if on, ask `provider` (`gh-actions` / `gitlab-ci`), `releaseTool` (`auto` (default) / `changesets` / `release-please` / `semantic-release` / `manual` / `none`), `runDeploy` (`off` (default) / `ask` / `auto`), and `finishRelease` (`off` (default) / `ask` / `auto`) — the **global defaults** for `/crew:ship` (the per-project `reference/deploy.md` runbook is created by `/crew:init`, not here). Write only the values the user confirmed; the rest stay as built-in defaults. **Set `crewVersion`** to the current plugin version.
3. **Confirm** what was written. These are the **global** layer — every project inherits them, and each project's `.planning/config.json` overrides them.

Never overwrite an existing global registry or config without explicit confirmation (offer to merge instead).

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:init` inside a project to scaffold its `.planning/`.
