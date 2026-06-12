---
description: One-time global crew setup — define your project types and tags and write the global config/registry under ~/.claude/crew/.
---

# /crew:setup

Establish the global layer that applies across all your projects. Uses the `crew-config` skill.

## Steps

1. **Ensure** `~/.claude/crew/` exists.
2. **Write `project-types.json`** — the archetype + tag registry. Start from the starter set in the `crew-config` skill. Ask whether the user wants to add or adjust archetypes/tags before writing.
3. **Optionally write `config.json`** — cross-project defaults (models, default PM provider, notifications, git behavior). Use the defaults from the `crew-config` skill; only set what the user wants to apply everywhere.
4. **Confirm** what was written. These are the **global** layer — every project inherits them, and each project's `.planning/config.json` overrides them.

Never overwrite an existing global registry or config without explicit confirmation (offer to merge instead).
