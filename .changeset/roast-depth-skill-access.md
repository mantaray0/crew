---
"@mantaray0/crew": minor
---

Couple Roast-Me depth to brief intensity, give four skills standalone entry points, and de-prefix the generic skills.

**Roast depth.** Roast-Me's Spec-Probe (`/crew:brief`) no longer stops the moment a Spec is writable — the stop is now gated by `brief.intensity`'s minimum challenge depth: `gentle` stops immediately, `normal` (default) requires at least one forced challenge round on load-bearing assumptions, `brutal` several mandatory rounds with every load-bearing assumption explicitly attacked. `intensity` now drives both the *tone* of the pushback and the *drill-depth*, orthogonal to `depth` (breadth). Documented in `crew-config`; `brief.md` scales its question baseline with intensity instead of a fixed count.

**Standalone skills.** `roast-me`, `planning`, `verify`, and `learn` each gain a `## Standalone usage` section — a second, state-free entry point usable ad-hoc with no `.planning/` state, returning results inline. `roast-me` carries prefix-free natural-language triggers ("roast me", "challenge my idea/plan/assumptions") so the bare skill fires without a command. The README documents the four as standalone tools, `roast-me` first and highlighted.

**Skill de-prefixing.** The generic, reusable skills lose the redundant `crew-` prefix — `crew-planning` → `planning`, `verification-loop` → `verify`, `crew-learn` → `learn`, `crew-deploy` → `deploy` (plugin skills surface bare, e.g. `/verify`, while commands stay namespaced, `/crew:verify` — different triggers, no collision). Truly crew-specific skills keep the prefix (`crew-config`, `crew-context`, `crew-conventions`). Commands are unchanged. Every reference across commands, skills, agents, README, and CLAUDE.md was updated.
