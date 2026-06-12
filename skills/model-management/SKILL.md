---
name: model-management
description: How crew picks the model for each task — task-types, manual vs auto mode, and override precedence. Use when dispatching sub-agents or running pipeline stages.
origin: crew
---

# Model Management

Each command and agent carries a **task-type**: `planning` · `execution` · `review` · `simplify` · `trivial`. The model used is resolved from `config.models`.

## Modes

- **`manual`** — map the task-type to the configured model id (`models.planning`, `models.execution`, `models.review`, `models.simplify`, and `trivial`).
- **`auto`** — a heuristic: planning/review → the strongest model; execution/simplify → a mid model; trivial → the cheapest. (`auto` ignores the per-type fields and decides by task-type tier.)

## Override precedence (highest wins)

1. **Ad-hoc** — an explicit model the user names in the moment.
2. **Project** — `.planning/config.json` → `models`.
3. **Global** — `~/.claude/crew/config.json` → `models`.
4. **Built-in default** — `auto`.

## Use

When a command dispatches a sub-agent (e.g. a reviewer in the verify loop), it resolves the model for that agent's task-type and passes it as the sub-agent's model override — so behavior is config-driven, not hard-wired in each agent file. The resolver lives at `src/models/resolve.ts` (`resolveModel(config, taskType)`).
