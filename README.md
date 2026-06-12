# crew

[![CI](https://github.com/mantaray0/crew/actions/workflows/ci.yml/badge.svg)](https://github.com/mantaray0/crew/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-7C3AED.svg)](https://www.claude.com/product/claude-code)

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

## Contributing

Contributions are welcome — most changes are just editing a markdown command, agent, or skill.
See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md). Releases
follow the changesets flow in [docs/RELEASING.md](docs/RELEASING.md). Found a security issue?
See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Daniel Baumert
