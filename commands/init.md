---
description: Initialize crew in the current project — pick a project type, capture the stack, and scaffold the committed .planning/ state.
---

# /crew:init

Set up `.planning/` for this project. Uses the `crew-config` skill (config schema + archetypes), `roast-me` for the stack interview, and `crew-conventions`.

**Follow `crew-conventions`:** walk step by step, ask each decision explicitly (archetype = single-select; tags = multi-select; stack values = free-text or confirm), never silently apply defaults, and respond in the user's language.

## Steps

1. **Detect the mode.** If `.planning/config.json` already exists, this is a **re-run → reconcile mode**, *not* a re-scaffold: bring the project config up to date with the installed plugin (see `crew-config` → **Config versioning & migration**). Read the current plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`; schema-diff the existing `config.json` (classify keys new / removed / unchanged); **first apply the known migrations** from `crew-config` → **Known migrations** (the section renames plus the workflow-nesting moves into `config.workflow.*` — e.g. `ship`→`workflow.ship`, `retro`→`workflow.learn`, `verify`→`workflow.execute.verify`, `finish.*`→step `run`s) so renamed/split/moved keys keep their value; **ask per new field — inherit-first** (`crew-config` → *Inherit-first writes*): the **take-from-global** choice is first and pre-selected, and writing nothing when chosen; use its purpose + recommended default from the `crew-config` schema (single-select for enums like `responseStyle` and the new `workflow.mode`/`run` gates, free-text for open values); offer to drop removed keys (`loop`/`state`/`brief.askOnlyWhenStuck`). **Then, per `crew-config` → *Config versioning & migration*** (delegated, not restated here): run the **one-time inherit-first cleanup** — at the inherit-first transition (gated on `crewVersion` < `0.16.0`), present the inheritable project fields whose written value equals the resolved global value as one batched multi-select "reset to inherit? (key removed)", candidates pre-selected; **offer the opt-in revisit pass** — re-walk every inheritable/workflow field with the same inherit-first form (current value pre-selected) so any parameter can be changed or reset; and allow **resetting** any single override back to inherit. Declining the revisit leaves the reconcile purely additive (lossless). **Do not** re-run the archetype/stack interview. Then stamp `crewVersion` to the current plugin version. **Also offer to migrate the plans layout:** legacy flat files in `plans/` (`_<slug>.md` briefs and bare `<id>_…md` phase plans) predate the numbered-milestone-folder structure — offer to move each into its `plans/<n>_<milestone-slug>/` folder (number-prefixed by milestone; brief → `_spec.md`; see `planning`). A pure `mv`, no content change. Do **not** overwrite `PROJECT.md` / `ROADMAP.md` / `LOG.md` or re-run the archetype interview. Skip the first-run scaffold steps below — the opt-in revisit pass above **reuses their inherit-first question form**, it does not re-scaffold. — Otherwise (`.planning/` absent), continue with the first-run scaffold.
2. **Pick a project type.** Read the global registry `~/.claude/crew/project-types.json` if present, else use the starter archetypes documented in the `crew-config` skill. Ask the user to pick one (`app` / `api-service` / `cli` / `marketing-site` / …) or "decide later". Seed `tags`, `stack`, and `testing.policy` from the chosen archetype.
3. **Stack interview.** Confirm or adjust DB / frontend / UI / backend-API / queue / deploy — pre-filled from the archetype and the user's defaults. Offer the escape "you decide → I propose → you approve".

**Inherit-first for steps 4–7 (read before asking).** Every config-driven question below follows **inherit-first** (`crew-config` → *Inherit-first writes* is the source of truth — reference it, don't restate the rule): the **first, pre-selected** option is **"take from global (currently: `<resolved value>`)"** — read from `~/.claude/crew/config.json`, falling back to the built-in default — and choosing it **omits the key** (dynamic inheritance). The actual values follow below it. Picking a concrete value **writes it, even when equal to the inherited value** (a deliberate freeze). The pre-selected answer is inherit **except** the two detected/project-specific cases noted below (`ship.releaseTool` on auto-detection, `testing.policy` from the archetype).

4. **File language (`config.language.files`).** Single-select: which language should crew write this project's files in (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md`, `plans/`)? **take from global** (first, pre-selected — omit the key) · **English** · **the user's language**. Inherit means the key is absent — **not** stored as `"inherit"`.
5. **Roast level (`workflow.brief.intensity`).** Single-select: how hard should Roast-Me challenge ideas during `/crew:brief` — **take from global** (first, pre-selected) · `gentle` · `normal` · `brutal`.
6. **Deploy / release interview (`config.workflow.ship` + runbook).** Ask **per leaf field**, inherit-first, **no block-level shortcut** — each field's first option is **take from global**. `enabled` is the **gating trunk**, asked first; if it resolves to **off**, skip the dependent ship fields below. Batch the independent ones:
   - `enabled` — take from global · **on** · off. (trunk)
   - `provider` — take from global · `gh-actions` · `gitlab-ci`.
   - `releaseTool` — `auto` (**recommended here** — pre-fill the value **detected** from the repo per `deploy` → Release mechanics; the detection exception to inherit-first) · take from global · `changesets` · `release-please` · `semantic-release` · `manual` · `none`.
   - `runDeploy` — take from global · `off` (push-triggered CI, the push *is* the deploy) · `ask` · `auto`.
   - `finishRelease` — take from global · `off` · `ask` · `auto` — **only ask when** the resolved `releaseTool` is a bot-PR tool (`changesets`/`release-please`).
   - `tagPattern` / `environments` — take from global, or a concrete value (free-text / list) to freeze.
   Then **actively create `reference/deploy.md`**: interview the concrete procedure — release strategy, branch/tag conventions, environments, secrets *policy* (pointers, never values), rollback, and (when `runDeploy ≠ off`) the deploy command(s) — write the runbook and index it one line under `PROJECT.md`'s `## Reference`.
7. **Workflow gates + cross-cutting (`config.workflow`, `responseStyle`).** Ask this group so the two-level model and the cross-cutting fields aren't silently defaulted (`crew-conventions`). **Batch these independent questions in an `AskUserQuestion` stepper**; each single-select is inherit-first (**take from global** first and pre-selected, showing the resolved value). Fields:
   - `responseStyle` — take from global · `concise` · `detailed` · `auto` — verbosity/format of crew's replies. **Actively asked here** (never blindly seeded).
   - `workflow.mode` — take from global · `manual` · `auto` — does the step chain advance between steps (execute → ship → learn → complete)?
   - `workflow.ship.run` — take from global · `off` · `ask` · `auto` · `smart` — the ship close-out gate (orthogonal to `ship.enabled` above; `config.git` still authorizes every push/PR).
   - `workflow.learn.run` — take from global · `off` · `ask` · `auto` · `smart`.
   - `workflow.complete.run` — take from global · `off` · `ask` · `auto` · `smart`.
   - `workflow.execute.loop` — take from global · `all` · `one` — the phase loop (`all` works through the whole milestone, `one` stops after each phase); and `workflow.execute.parallel` — take from global · `auto` · `manual` · `off` — the execution strategy.

   Write only the **explicitly chosen** values into `config.*`; **every "take from global" choice → leave the field out** so it inherits at runtime through the `defaults < global < project` layering.
8. **Commit or ignore `.planning/`.** Single-select: **commit** `.planning/` (recommended — shareable, part of project history, readable by PM integrations) or **gitignore** it (local-only)? If **gitignore**, add a `.planning/` line to the project's `.gitignore` (create the file if missing). If **commit**, make sure `.planning/` is not ignored.
9. **Scaffold `.planning/`:**
   - `config.json` — **write only the project's own facts and the values the user explicitly chose** — **not** a full default structure (`crew-config` → *Inherit-first writes*: a "take from global" choice **omits the key**, so it inherits at runtime). Always written: `projectType`, `tags`, `stack`, `crewVersion` (the current plugin version, from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`) — these are inherently project-specific. Written **only when explicitly chosen** (not inherited): `testing.policy`, `language.files`, `responseStyle`, `workflow.brief.intensity`, the `workflow.ship.*` fields, and any `workflow` gate (`mode`/`ship.run`/`learn.run`/`complete.run`/`execute.loop`/`execute.parallel`). With every inheritable question answered "take from global", `config.json` carries **only** `projectType`/`tags`/`stack`/`crewVersion`.
   - `PROJECT.md` — architecture decisions (the *why*), current state, constraints, and a stack table **mirrored from `config.stack`** (the source of truth) — written in `config.language.files`.
   - `ROADMAP.md` — an empty first milestone.
   - `LOG.md`, `BACKLOG.md`, `claims.json` (`{}`), and an empty `plans/` directory.
10. **Confirm** and point to `/crew:brief` (new feature) or `/crew:plan`.

Write the files with your file tools — deterministic content, no guessing. Write only the project's facts (`projectType`/`tags`/`stack`/`crewVersion`) plus the explicitly-chosen overrides (inherit-first — `crew-config` → *Inherit-first writes*); inherited fields are omitted, not seeded.

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:brief` to clarify your first idea — or `/crew:plan` if the work is already clear.
