# crew

Config-driven agentic workflow harness for Claude Code. Lightweight planning,
strong cross-session context handling, configurable verify pipeline and model
management. Project state lives in a committed `.planning/` directory.

## Install (Claude Code plugin)

```
/plugin marketplace add <repo-or-path>
/plugin install crew
```

## Initialize a project

```
npx @mantaray0/crew init        # or: pnpm dlx @mantaray0/crew init / bunx @mantaray0/crew init
```

Creates `.planning/` with `config.json`, `PROJECT.md`, `roadmap.md`, `log.md`,
`claims.json`, `plans/`, `sessions/`.

## Status

```
/crew:status
```

## Configuration

Behavior is controlled by `.planning/config.json` (project) layered over
`~/.claude/crew/config.json` (global) over built-in defaults. See
`docs/specs/2026-06-12-crew-harness-core-design.md` for the full schema.
