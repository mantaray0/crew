# crew

[![CI](https://github.com/mantaray0/crew/actions/workflows/ci.yml/badge.svg)](https://github.com/mantaray0/crew/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-7C3AED.svg)](https://www.claude.com/product/claude-code)

A small planning plugin for **Claude Code**. crew keeps a project's plan and history in a
committed `.planning/` directory, so any fresh session knows what was decided, what is done and
what comes next. It then runs each phase of the plan in its own fresh sub-agent, with your checks
and Claude Code's built-in `/code-review` after every phase.

No CLI, no build, nothing to install besides the plugin.

## Install

```
/plugin marketplace add mantaray0/crew
/plugin install crew@mantaray0
```

## The loop

```
/crew:init  →  /crew:brief  →  /crew:plan  →  /crew:execute
```

| Command | What it does |
|---|---|
| `/crew:init` | Set up `.planning/` in the current project |
| `/crew:brief [idea]` | Clarify an idea in rounds of questions (Roast-Me), then write `PROJECT.md` or a milestone `_spec.md` |
| `/crew:plan [milestone]` | Cut the brief into phases, one plan file each; waits for your approval |
| `/crew:execute [phase]` | Run the milestone's phases one after another, each in a fresh `crew:executor` |
| `/crew:adjust [change]` | Insert, reorder, defer or drop phases mid-flight |
| `/crew:backlog [idea \| list]` | Capture an idea, or list and triage the backlog |
| `/crew:status` | Where the project stands |
| `/crew:resume` | Briefing for a fresh session: state, what not to retry, next step |

Run `/clear` between commands; the state is in the files, not in the conversation.

## What a phase does

`/crew:execute` marks the phase `[>]` and hands it to the `crew:executor` agent, which:

1. implements the phase plan,
2. runs the checks listed under `## Checks` in `PROJECT.md` (or the `test`, `typecheck` and
   `lint` scripts in `package.json`), in the foreground, until they pass,
3. runs `/code-review` at the configured effort, and fixes each finding or rejects it with a
   one-sentence reason,
4. commits (format from your project's `CLAUDE.md`), with the rejected findings in the body,
5. stamps the phase `[x]` in `ROADMAP.md` and appends one line to `LOG.md`.

When every phase of a milestone is done, crew offers to close it: refresh `PROJECT.md` and move the
milestone's plans into `archive/`. crew never pushes, opens pull requests or switches branches on
its own.

## `.planning/`

```
.planning/
  PROJECT.md        what the project is, decisions and why, current state, ## Checks
  ROADMAP.md        milestones and phases: [ ] open · [>] in progress · [x] done · [~] deferred
  plans/<n>_<slug>/ _spec.md (intent) + one plan file per phase
  backlog/          one file per idea
  LOG.md            one line per phase: date · phase · commit · verify result
  archive/          closed milestones
  reference/        long-form docs, read on demand
  config.json       optional, see below
```

At session start a hook prints the active milestone and the next phase, a few lines in total.

## Configuration

Everything is optional. Layers: built-in defaults, then `~/.claude/crew/config.json`, then
`.planning/config.json`; `"inherit"` means "take the layer below".

```json
{
  "language": { "files": "en" },
  "workflow": { "execute": { "loop": "all", "review": "medium" } }
}
```

| Key | Values |
|---|---|
| `language.files` | Language crew writes `.planning/` content in |
| `workflow.execute.loop` | `all` runs the milestone's phases in sequence, `one` stops after each |
| `workflow.execute.review` | `/code-review` effort per phase: `off`, `low`, `medium`, `high`, `xhigh`, `max` |

Commit format, branch names and issue tracker belong in your project's `CLAUDE.md`. Any other key
is removed at session start (backup in `~/.claude/crew/backup/`).

## Upgrading from 0.x

Existing `.planning/` directories work as they are; nothing is migrated or rewritten.

- **Removed commands:** `ship`, `finish`, `learn`, `complete`, `archive`, `rollback`, `report`,
  `pull`, `update`, `setup`, `verify`, `quick`, and `execute dispatch`. Closing a milestone is now a
  step in `execute` and `status`.
- **Removed agents:** every reviewer, hardening and simplify agent, `architect`, `code-explorer`,
  `build-error-resolver`, `merge-coordinator`. Review is Claude Code's built-in `/code-review`;
  exploring and planning use the built-in Explore and Plan agents.
- **Config is cleaned automatically.** At the first session start after the update, crew rewrites
  `~/.claude/crew/config.json` and the project's `.planning/config.json` down to the three keys
  above (dropping `"inherit"` values, which mean the same as no value) and moves the unused
  `~/.claude/crew/project-types.json` aside. Originals go to `~/.claude/crew/backup/`; each
  project's config is cleaned the first time you open a session in it. Commit the changed
  `.planning/config.json`. If a project relied on `git.commitPattern` or `git.baseBranch`, write
  that convention into its `CLAUDE.md`.
- **`LOG.md`:** new entries are one line each; old entries stay as written.
- **Hooks:** the Notification and Stop hooks are gone; the SessionStart hook no longer injects
  `PROJECT.md`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Releases run through Changesets.

## License

[MIT](LICENSE)
