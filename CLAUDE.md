# crew

`@mantaray0/crew` — a config-driven, agentic workflow harness for Claude Code, shipped as a
Claude Code plugin. crew keeps project state across sessions in a committed `.planning/` directory
and runs every command interactively and config-driven.

## Stack

| Area | Choice |
|---|---|
| Kind | Claude Code plugin |
| Language | Markdown (commands, agents, skills) + JavaScript (ESM, `.mjs` scripts) |
| Runtime | Node ≥ 18 |
| Package manager | pnpm |
| Release | Changesets |
| CI | GitHub Actions |

## Architecture

The plugin is declarative — the logic lives in Markdown instructions, not compiled code:

- **`commands/`** — the `/crew:*` slash commands (brief, plan, execute, verify, dispatch, …).
- **`agents/`** — specialized sub-agent definitions (reviewer, planner, executor, …).
- **`skills/`** — reusable knowledge that commands load (`crew-config`, `crew-conventions`,
  `crew-planning`, `verification-loop`, `git-merge`, `roast-me`, …). **The skills are the source of truth.**
- **`hooks/`** — session-lifecycle hooks (incl. config-version reconciliation at session start).
- **`scripts/`** — Node helper scripts (e.g. `sync-version.mjs` for the release process).
- **`.claude-plugin/`** — plugin manifest (`plugin.json`, version).

### Guiding decisions (the *why*)

- **Config-driven, not hardcoded.** Behavior comes from `config.json` layered
  `defaults < global (~/.claude/crew) < project (.planning)`. There is no compiled validator —
  the schema in the `crew-config` skill *is* the contract. This keeps the plugin universal and
  per-project tunable without code changes.
- **State lives in `.planning/`.** PROJECT/ROADMAP/LOG/BACKLOG + `plans/` carry project context across
  sessions so a fresh context can orient at any time (`/crew:resume`). Plans are grouped into
  **numbered milestone folders** — `plans/<n>_<milestone-slug>/` (number-prefixed so they sort and read
  at a glance when collapsed) holding an optional `_spec.md` plus the numbered `<id>-<title>.md` phase plans.
- **Interactive by convention.** `crew-conventions` is the rule: surface every decision, batch only
  the independent ones into an `AskUserQuestion` stepper, stay sequential on dependencies, never silently
  apply a default — speed comes from good recommended answers.
- **Repo stays English; project content follows `language.files`.** Plugin code/commands/skills are
  English (universal); the files crew writes into a *user* project follow the configured language.

## Constraints / conventions

- **`.planning/` is gitignored in this repo** (local-only) — this repo is the plugin itself, not a user
  project, so the planning state must not mix into the plugin history.
- **Releases run through Changesets** — never bump versions by hand; `pnpm version` syncs the plugin
  manifest via `scripts/sync-version.mjs`.
- **Markdown-first** — new capabilities are commands/skills/agents, not compiled code.
- **crew plans itself.** This repo uses crew for its own planning; `.planning/` is the source of
  truth for project state — PROJECT/ROADMAP/LOG/BACKLOG, plans, and load-on-demand runbooks under
  `.planning/reference/`. There is no `docs/` folder.
- Testing policy: `tests-required` (cli archetype) — adjust if a test setup for the scripts appears.
