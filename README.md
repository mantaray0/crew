# crew

A config-driven agentic workflow harness for **Claude Code** — distributed as a pure plugin
(commands, agents, skills, hooks). Lightweight planning, strong cross-session context handling,
a configurable verify pipeline, model management, parallel dispatch, and self-learning. Project
state lives in a committed `.planning/` directory; behavior is driven by `config.json`.

No CLI, no build, no npm — Claude runs everything through the plugin.

## Install

```
/plugin marketplace add <repo-or-path>
/plugin install crew
```

## Use

```
/crew:setup     # one-time: define global project types/tags + cross-project defaults
/crew:init      # per project: pick a project type, capture the stack, scaffold .planning/
/crew:brief     # clarify an idea / feature (roast-me)
/crew:plan      # roadmap + plans
/crew:next      # execute the next phase (verify pipeline + atomic commit)
/crew:status    # where are we
/crew:resume    # orient a fresh session
```

Full command surface: `init · setup · brief · backlog · plan · next · dispatch · verify · adjust · status · resume · pull · quick · retro · rollback · report`.

## Configuration

Behavior is controlled by `.planning/config.json` (project) layered over
`~/.claude/crew/config.json` (global) over built-in defaults. The full schema and the
starter project-type/tag registry live in the **`crew-config`** skill. See also
`docs/specs/2026-06-12-crew-harness-core-design.md`.
