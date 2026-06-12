---
description: Initialize crew in the current project — pick a project type, capture the stack, and scaffold the committed .planning/ state.
---

# /crew:init

Set up `.planning/` for this project. Uses the `crew-config` skill (config schema + archetypes), `roast-me` for the stack interview, and `crew-conventions`.

**Follow `crew-conventions`:** walk step by step, ask each decision explicitly (archetype = single-select; tags = multi-select; stack values = free-text or confirm), never silently apply defaults, and respond in the user's language.

## Steps

1. **Guard.** If `.planning/` already exists, stop and tell the user (offer to overwrite only if they ask).
2. **Pick a project type.** Read the global registry `~/.claude/crew/project-types.json` if present, else use the starter archetypes documented in the `crew-config` skill. Ask the user to pick one (`app` / `api-service` / `cli` / `marketing-site` / …) or "decide later". Seed `tags`, `stack`, and `testing.policy` from the chosen archetype.
3. **Stack interview.** Confirm or adjust DB / frontend / UI / backend-API / queue / deploy — pre-filled from the archetype and the user's defaults. Offer the escape "you decide → I propose → you approve".
4. **Scaffold `.planning/`** (committed):
   - `config.json` — the full default config from the `crew-config` skill, with `projectType`, `tags`, `stack`, and `testing.policy` seeded.
   - `PROJECT.md` — Stack, Architektur-Entscheidungen (the *why*), Aktueller Stand, Constraints.
   - `roadmap.md` — an empty first milestone.
   - `log.md`, `backlog.md`, `claims.json` (`{}`), and empty `plans/` and `sessions/` directories.
5. **Confirm** and point to `/crew:brief` (new feature) or `/crew:plan`.

Write the files with your file tools — deterministic content, no guessing. Keep `config.json` complete so behavior is fully config-driven from the start.
