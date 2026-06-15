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
2. **Schema-diff** the existing config against the `crew-config` schema: first apply the **Known migrations** from `crew-config` (the section renames plus the workflow-nesting moves into `config.workflow.*` — e.g. `ship`→`workflow.ship`, `retro`→`workflow.learn`, `verify`→`workflow.execute.verify`, `finish.*`→step `run`s) so renamed/split/moved keys keep their value, then classify each remaining key as **new** (in schema, missing here), **removed** (here, gone from schema), or unchanged. Report the diff compactly.
3. **Ask per new field — inherit-first.** For each new key, show its purpose + recommended default (from the `crew-config` schema) and ask the user what they want — single-select for enums (e.g. `responseStyle`), free-text for open values. Per *Inherit-first writes*, **"take the built-in default"** is the first, pre-selected option and **omits the key** when chosen. Never silently apply a default.
4. **One-time cleanup + reset.** Per `crew-config` → *Config versioning & migration* (delegated): at the inherit-first transition (gated on `crewVersion` < `0.16.0`), run the **one-time inherit-first cleanup** — present global fields whose written value equals the resolved built-in default as one batched multi-select "reset to inherit? (key removed)", candidates pre-selected (version-gated, runs once). Independently, any single override can be **reset** to the built-in default (key removed) at any time. **Flag removed fields** and offer to drop them.
5. **Stamp** `crewVersion` to the current plugin version and save. **Offer the opt-in revisit pass** — re-walk the config groups below (the registry too) with the same inherit-first form, current value pre-selected, so any global parameter can be changed or reset; declining leaves the reconcile purely additive (lossless).

### First run (no config yet)

1. **Registry (`project-types.json`).** Show the starter archetypes + tags from the `crew-config` skill. Ask, as explicit questions, whether to add / rename / remove any archetype or tag (a multi-select of "keep as-is vs adjust", then free-text for the adjustments). Only write after the user confirms the final set.
2. **Global `config.json`.** Decide whether to write one at all (single-select). If yes, go through the config groups, each **inherit-first** (`crew-config` → *Inherit-first writes* is the source of truth — reference it, don't restate). On the global level the inherit choice is **"take the built-in default (currently: `<default>`)"** (same mechanic as init's "take from global"; there is no layer under global except the schema defaults) — it is the **first, pre-selected** option and **omits the key**; an explicitly chosen value is **written even when equal to the default** (a deliberate freeze against later default drift). **Batch the independent workflow gates into one `AskUserQuestion` stepper** (`crew-conventions`); ask **every** gate (inherit pre-selected, but asked — never silently defaulted). The groups:
   - **Cross-cutting (top-level):** `models`, `git`, `notifications`, `tasks.provider`, `language.files`, `responseStyle`. For `language.files`, ask which language crew writes a project's files in (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, plans) — **take the built-in default** (`en`) · a concrete language. For `responseStyle`, **take the built-in default** (`concise`) · `detailed` · `auto`.
   - **`workflow.mode`** — **take the built-in default** (`manual`) · `auto`: does the step chain advance between steps (execute → ship → learn → complete)?
   - **`workflow.brief.intensity`** — **take the built-in default** (`normal`) · `gentle` · `brutal` — how hard Roast-Me challenges an idea during `/crew:brief`.
   - **`workflow.execute`** — `parallel` (**take the built-in default** (`auto`) · `manual` · `off`, the execution strategy) and `loop` (**take the built-in default** (`all`) · `one`, the phase loop — `all` works through the whole milestone, `one` stops after each phase).
   - **`git.isolation`** — **take the built-in default** (`off`) · `worktree-per-milestone` · `branch-per-milestone` · `worktree-per-phase` · `branch-per-phase` — **opt-in** work isolation (`off` = linear; `*-per-milestone` = one worktree+branch per milestone for parallel milestones, `*-per-phase` = per phase). And **`git.baseBranch`** — **take the built-in default** (`main`) · a branch name — fork/merge target for isolation branches (only for a non-`main` integration branch like `redesign`). The other `git.*` fields (`autoPush`/`autoPR`/`mergeStrategy`/`branchPattern`/…) keep their built-in defaults — not asked here.
   - **`workflow.ship`** — asked **per leaf field**, inherit-first (each field's first, pre-selected option is **take the built-in default**), **no block-level shortcut**, with `enabled` as the **gating trunk** asked first; if it resolves to **off**, skip the dependent ship fields. These are the **global defaults** for `/crew:ship` (the per-project `reference/deploy.md` runbook is created by `/crew:init`, not here):
     - `enabled` — take the built-in default (`on`) · off. (trunk)
     - `provider` — take the built-in default · `gh-actions` · `gitlab-ci`.
     - `releaseTool` — take the built-in default (`auto`) · `changesets` · `release-please` · `semantic-release` · `manual` · `none`.
     - `runDeploy` — take the built-in default (`off`) · `ask` · `auto`.
     - `finishRelease` — take the built-in default (`off`) · `ask` · `auto` — **only ask when** the resolved `releaseTool` is a bot-PR tool (`changesets`/`release-please`).
     - `tagPattern` / `environments` — take the built-in default, or a concrete value to freeze.
     - `run` — take the built-in default (`ask`) · `off` · `auto` · `smart` — the ship close-out gate (orthogonal to `enabled`; `config.git` still authorizes every push/PR).
   - **`workflow.learn.run`** and **`workflow.complete.run`** — each **take the built-in default** (`ask`) · `off` · `auto` · `smart`: the milestone-close gates the `/crew:finish` strand reads in order Ship → Learn → Complete.
   Write only the values the user **explicitly chose**; every "take the built-in default" choice **omits the key** (no full default structure written). **Set `crewVersion`** to the current plugin version.
3. **Confirm** what was written. These are the **global** layer — every project inherits them, and each project's `.planning/config.json` overrides them.

Never overwrite an existing global registry or config without explicit confirmation (offer to merge instead).

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:init` inside a project to scaffold its `.planning/`.
