---
description: Reconcile crew config with the installed plugin — a findable entry point for the version/schema reconcile that otherwise hides inside /crew:init and /crew:setup.
argument-hint: "[global | project, optional — defaults to project, offers global too]"
---

# /crew:update

Bring your crew config up to date with the installed plugin: compare versions, diff the schema, apply known migrations, ask about each new field, and re-stamp `crewVersion`. This is the **same reconcile** that `/crew:init` (project) and `/crew:setup` (global) run on a re-run — surfaced as its own verb so it's discoverable. It is **pure reconcile**: it never re-scaffolds, never re-runs the archetype/stack interview, and never touches `PROJECT.md` / `ROADMAP.md` / `LOG.md`.

Uses the `crew-config` skill (**Config versioning & migration** — the source of truth for the reconcile procedure and the schema) and `crew-conventions`.

**Follow `crew-conventions`:** ask each decision explicitly (single-select for enums, free-text for open values), never silently apply a default (present it as the recommended choice), and respond in the user's language.

## Scope

`$ARGUMENTS` picks the level — `project` (default), `global`, or empty (reconcile the project, then offer global too):

- **`project`** — reconcile `.planning/config.json`. The default.
- **`global`** — reconcile `~/.claude/crew/config.json`.
- **empty** — reconcile the project, then, if `~/.claude/crew/config.json` exists, offer to reconcile the global config too (single-select).

If the requested config is absent, say so and point at the command that creates it (`/crew:init` for a project, `/crew:setup` for global) instead of scaffolding here.

## Steps

1. **Read the plugin version** from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` (`version`).
2. **Project reconcile** (unless `$ARGUMENTS` is `global`): if `.planning/config.json` exists, run the reconcile procedure from `crew-config` → **Config versioning & migration** against it — apply the **Known migrations** first (so renamed/split keys keep their value), then schema-diff (classify keys new / removed / unchanged), ask per new field using its purpose + recommended default from the schema, offer to drop removed keys, and stamp `crewVersion` to the plugin version. **Also offer the plans-layout migration** — same as `/crew:init` step 1 (see `planning` for the file-pattern details): a pure `mv`, no content change.
3. **Global reconcile** (when `$ARGUMENTS` is `global`, or empty and `~/.claude/crew/config.json` exists → ask first): run the **same** procedure from `crew-config` against `~/.claude/crew/config.json`.
4. **Report** the diff and what changed compactly — per level: version before/after, new fields resolved, removed fields dropped, migrations applied.

The reconcile steps and the schema live in `crew-config` — this command **delegates** to them and does not restate them, so there is a single source of truth.

## Hand-off

When you're done, end your reply **in the user's language**:

> **Done?** Your config now matches the installed plugin. Run `/clear` to reset the context before the next task.
