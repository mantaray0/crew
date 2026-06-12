---
description: One-time global crew setup — define your project types and tags and write the global config/registry under ~/.claude/crew/.
---

# /crew:setup

Establish the global layer that applies across all your projects. Uses the `crew-config` and `crew-conventions` skills.

**Follow `crew-conventions`:** walk this step by step, ask each decision as an explicit question (free-text / single-select / multi-select), never silently apply defaults (present them as the recommended choice), and respond in the user's language.

## Steps

1. **Ensure** `~/.claude/crew/` exists.
2. **Registry (`project-types.json`).** Show the starter archetypes + tags from the `crew-config` skill. Ask, as explicit questions, whether to add / rename / remove any archetype or tag (a multi-select of "keep as-is vs adjust", then free-text for the adjustments). Only write after the user confirms the final set.
3. **Global `config.json`.** Decide whether to write one at all (single-select). If yes, go through the config groups (`models`, `git`, `notifications`, `tasks.provider`, `execution`, `language.files`, …) **one at a time** — for each, single-select "keep default vs override", and on override ask the specific value (select / free-text). For `language.files`, ask which language the project files crew generates (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, plans) should be written in (default `en`). Write only the values the user confirmed; the rest stay as built-in defaults.
4. **Confirm** what was written. These are the **global** layer — every project inherits them, and each project's `.planning/config.json` overrides them.

Never overwrite an existing global registry or config without explicit confirmation (offer to merge instead).
