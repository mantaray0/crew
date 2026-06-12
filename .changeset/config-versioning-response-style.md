---
"@mantaray0/crew": minor
---

Three related additions:

- **Config versioning & reconcile.** New `crewVersion` config field records the plugin version a config was last reconciled with. Re-running `/crew:setup` (global) or `/crew:init` (project) now enters a **reconcile mode** instead of re-scaffolding: it schema-diffs the existing config against the current `crew-config` schema and **asks about each new field** (with its purpose and recommended default) rather than silently applying defaults, then stamps `crewVersion`. The `session-start` hook warns once when a project's config is behind the installed plugin.
- **`responseStyle` option** (global + project override): `concise` (default — short, tables for comparisons/findings), `detailed` (full prose), or `auto`. Enforced by `crew-conventions` for every command reply; it changes format/length only, never the one-decision-at-a-time interaction flow.
- **Brief file naming.** `/crew:brief` now writes the un-numbered initiative spec as `_<slug>.md` (underscore-prefixed) so briefs are visually distinct from numbered phase plans (`<id>-<title>.md`) in `plans/`. `/crew:plan` reads the `_<slug>.md` brief and produces the numbered phase plans.
