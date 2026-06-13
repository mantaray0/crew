---
name: crew-config
description: The crew config schema and the project-type/tag registry — the source of truth for config.json, global defaults, and archetypes. Use when running /crew:init or /crew:setup, or when reading/writing any crew config.
origin: crew
---

# crew Config & Registry

crew is **config-driven**: behavior comes from `config.json`, layered **defaults < global (`~/.claude/crew/config.json`) < project (`.planning/config.json`)**. There is no compiled validator — these schemas are the contract; write valid JSON.

## `config.json` (full defaults)

```jsonc
{
  "crewVersion": null,                 // crew plugin version this config was last reconciled with; set by /crew:init & /crew:setup, checked on session start
  "git": {
    "autoCommitPerPhase": true,        // atomic commit after a verified phase
    "autoPush": false,                 // never touch the remote without approval
    "autoPR": false,
    "commitStyle": "conventional",
    "branchPattern": "feat/{slug}",
    "isolation": "worktree-per-feature", // | "branch-per-feature" | "linear"
    "mergeStrategy": "integration-branch", // | "pr" | "ask-each"
    "askBeforeMerge": false,
    "conflictPolicy": "resolve-or-ask"  // | "always-ask" | "autonomous"
  },
  "deploy": {
    "enabled": true,                   // is /crew:ship available here? (replaces the old mode:off)
    "provider": "gh-actions",          // "gh-actions" | "gitlab-ci"
    "tagPattern": "v{version}",
    "environments": [],                // optional named environments (prod, staging, …)
    "runDeploy": "off"                 // "off" | "ask" | "auto" — run an imperative deploy command after the git steps? off = push-triggered CI (the push IS the deploy)
  },
  "execution": {
    "parallel": "auto",                // | "manual" | "off"
    "maxConcurrent": 3,
    "onDeviation": "small-self-major-ask" // | "always-ask" | "autonomous"
  },
  "verify": {
    "default": ["verify", "review", "harden", "simplify"],
    "perPhaseOverride": true
  },
  "models": {
    "mode": "auto",                    // | "manual"
    "planning": "opus", "execution": "sonnet", "review": "opus",
    "simplify": "sonnet", "trivial": "haiku"
  },
  "clarify": {
    "depth": "normal",                 // "light" | "normal" | "deep" — how broad (coverage)
    "intensity": "normal",             // "gentle" | "normal" | "brutal" — how hard Roast-Me pushes back
    "askOnlyWhenStuck": true,
    "specArtifact": "section"          // "section" | "separate" | "off"
  },
  "tasks": { "provider": "local", "writeBack": false, "projectKey": null },
  "testing": { "policy": "from-archetype" }, // | "tdd" | "tests-required" | "optional"
  "security": { "auto": false },       // never auto; recommended on sensitive scope
  "notifications": {
    "enabled": true,
    "events": ["blocker", "completion"],
    "channel": "os"                    // "os" | "push:ntfy" | "push:pushover" | "off"
  },
  "learn": { "enabled": true },
  "state": { "commitSessions": true },
  "loop": { "maxIterations": 6 },
  "observability": { "trackCost": true },
  "language": { "files": "en" },
  "responseStyle": "concise",          // "concise" | "detailed" | "auto" — verbosity/format of the assistant's command replies (see crew-conventions)
  "projectType": null,
  "tags": [],
  "stack": {}
}
```

Auto model tiers: planning/review → strongest, execution/simplify → mid, trivial → cheap. `manual` uses the per-type ids. Override precedence: ad-hoc > project > global > built-in default.

**`language.files`** sets the language of the project files crew writes (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md`, `plans/`). Default `"en"`; ask the user at `/crew:setup` (global) or `/crew:init` (per project). This is separate from the *conversation* language (see `crew-conventions`): the plugin repo and config keys stay English, but the user's own project files may be written in their language.

**`responseStyle`** controls how verbose and how formatted the assistant's command replies are. `crew-conventions` enforces it. Default `"concise"`.

| value | behavior |
|---|---|
| `concise` (default) | Short answers. Lead with the conclusion. Use a **table** for comparisons, findings, trade-offs, or option lists; keep prose to a few lines. |
| `detailed` | Full prose explanations — narrative findings, reasoning shown, longer walkthroughs. |
| `auto` | Pick per content: table for structured comparisons/findings, prose for narrative explanation. |

Resolved through the normal layering — a project's `.planning/config.json` overrides the global default (e.g. global `concise`, one project `detailed`).

**`clarify.intensity`** controls how hard Roast-Me challenges an idea during `/crew:brief` — **orthogonal** to `clarify.depth` (depth = how *broad* the questioning, intensity = how *hard* it pushes back). The recommended answer carries in every level (in `brutal` it may be "drop this"). Default `"normal"`. Ask at `/crew:setup` (global) or `/crew:init` (per project), resolved project > global > default — like `language.files`.

| value | behavior |
|---|---|
| `gentle` | Pure clarification: fill gaps, recommend a default, don't push back. |
| `normal` (default) | Push on the load-bearing weak spots, name obvious scope-creep, question one or two load-bearing assumptions. |
| `brutal` | Attack assumptions ("do you actually need this?"), surface contradictions, steelman cutting scope, name every scope risk. |

**`config.deploy`** drives `/crew:ship` (release/deploy). Layered global < project; ask at `/crew:setup` and `/crew:init`. Provider `gh-actions` (via `gh`) or `gitlab-ci` (via `glab`).

| field | behavior |
|---|---|
| `enabled` (default `true`) | Is `/crew:ship` available for this project? `false` → ship explains how to turn it on and stops. Replaces the old `mode: off`. |
| `runDeploy` (default `off`) | The one knob `config.git` does **not** cover: does crew run an **imperative** deploy command after the git steps? `off` = push-triggered CI (the push *is* the deploy). `ask`/`auto` = imperative world (Vercel/Fly), command sourced from `reference/deploy.md`. |
| `provider` | `gh-actions` (PRs/status via `gh`) or `gitlab-ci` (MRs/status via `glab`). |
| `tagPattern` | Release tag shape, e.g. `v{version}`. |
| `environments` | Optional named environments (prod, staging, …). |

**`config.git` is the single git authority.** ship has **no** deploy-specific push axis: every git step (commit/push/PR/merge) defers to `config.git` (`autoCommitPerPhase` / `autoPush` / `autoPR` / `mergeStrategy`). In a push-triggered setup the prod trigger *is* the push — so it belongs to `git.autoPush` (default false → ask), i.e. to the user. ship degrades gracefully — a local `version+commit+tag` is a valid partial result when push/PR are declined.

**`config.stack`** is the **single source of truth** for the project's stack *facts* (language / app / db / orm / …) — it drives tag-based reviewer selection and grounding. `PROJECT.md` shows the stack as a **derived mirror** and carries the *why* (architecture decisions); it is **not** a second place to edit the facts. Change the stack in `config.stack`; crew updates the `PROJECT.md` table to match. The stack is standing context — it stays in the auto-loaded `PROJECT.md`, never in load-on-demand `reference/`.

## Config versioning & migration

`crewVersion` records the crew plugin version this config was last reconciled with. The **current** plugin version lives in `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` (`version`).

- **On scaffold** (`/crew:init`, `/crew:setup` first run): write `crewVersion` = the current plugin version.
- **On session start:** the `session-start` hook compares the project's `config.crewVersion` against the plugin version and, if they differ (or `crewVersion` is missing), prints a one-line "config may be out of date — run `/crew:init` to reconcile" notice.
- **On re-run** of `/crew:setup` (global config) or `/crew:init` (project config): if the config already exists, enter **reconcile mode** instead of scaffolding:
  1. **Schema-diff.** Compare the existing config's keys against this schema (the contract). Classify each: **new** (in the schema, missing from the config), **removed** (in the config, no longer in the schema), **unchanged**.
  2. **Ask per new field.** For every new key, show the user its purpose and recommended default (from this schema) and ask what they want — as the fitting question type (single-select for enums like `responseStyle`, free-text for open values), following `crew-conventions`. Never silently apply a default.
  3. **Flag removed fields.** List keys that no longer exist in the schema; offer to drop them.
  4. **Stamp the version.** After applying confirmed changes, set `crewVersion` to the current plugin version.

  This is a procedure, not a coded migration: there is no compiled migrator — diff the live config against this schema and drive the questions from it.

### Known migrations

The schema-diff is generic, but some changes are **renames/splits** where a blind new/removed diff would drop the user's value. Apply these explicitly *before* the generic diff:

| change | mapping |
|---|---|
| `deploy.mode` removed → `deploy.enabled` + `deploy.runDeploy` | `off` → `enabled: false` · `orchestrate` → `enabled: true, runDeploy: off` · `execute` → `enabled: true, runDeploy: ask` |

Also: if a `.planning/DEPLOY.md` exists, note in the reconcile that its content now belongs in `reference/deploy.md` (structured fields → `config.deploy`); offer to move it (a `mv` + the user trims to prose). Never auto-delete it.

## File naming in `.planning/`

- **Documents are UPPERCASE:** `PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md` (like `README`/`CHANGELOG`).
- **Data files are lowercase:** `config.json`, `claims.json`.
- **Directories are lowercase:** `plans/`, `sessions/`.

## `project-types.json` (starter registry — global layer)

A **tag** is atomic and activates skills/rules; a **project type (archetype)** is a curated tag bundle + defaults. Pick one at `/crew:init`; the project's resolved tag-set drives which rules/skills are active.

```jsonc
{
  "tags": [
    { "name": "nextjs", "skills": ["nextjs", "react-patterns"], "rules": ["react"] },
    { "name": "hono", "skills": ["hono-api"], "rules": ["api"] },
    { "name": "drizzle", "skills": ["drizzle-postgres"], "rules": ["database"] },
    { "name": "postgres", "skills": ["drizzle-postgres"], "rules": ["database"] },
    { "name": "tailwind", "skills": ["tailwind"], "rules": [] },
    { "name": "shadcn-baseui", "skills": ["shadcn-baseui"], "rules": [] },
    { "name": "tanstack", "skills": ["tanstack-query", "tanstack-form", "tanstack-table"], "rules": [] },
    { "name": "bullmq-redis", "skills": ["bullmq-redis"], "rules": [] },
    { "name": "bun", "skills": ["bun-scripts"], "rules": [] },
    { "name": "auth", "skills": [], "rules": ["security"] },
    { "name": "payments", "skills": [], "rules": ["security"] },
    { "name": "realtime", "skills": [], "rules": [] }
  ],
  "archetypes": [
    { "name": "app", "tags": ["nextjs", "drizzle", "postgres", "tailwind", "shadcn-baseui", "tanstack", "auth"],
      "stack": { "language": "TypeScript", "app": "Next.js", "db": "Postgres", "orm": "Drizzle", "ui": "shadcn + Base UI", "styling": "Tailwind CSS" },
      "defaults": { "testing": "tests-required" } },
    { "name": "api-service", "tags": ["hono", "drizzle", "postgres", "bun"],
      "stack": { "language": "TypeScript", "api": "Hono", "runtime": "Bun", "db": "Postgres", "orm": "Drizzle" },
      "defaults": { "testing": "tdd" } },
    { "name": "cli", "tags": ["bun"],
      "stack": { "language": "TypeScript", "runtime": "Bun" },
      "defaults": { "testing": "tests-required" } },
    { "name": "marketing-site", "tags": ["nextjs", "tailwind"],
      "stack": { "language": "TypeScript", "app": "Next.js", "styling": "Tailwind CSS" },
      "defaults": { "testing": "optional" } },
    { "name": "monorepo", "tags": ["nextjs", "hono", "drizzle", "postgres", "tailwind", "shadcn-baseui", "tanstack", "bullmq-redis", "bun", "auth", "payments", "realtime"],
      "stack": { "language": "TypeScript", "app": "Next.js", "api": "Hono", "runtime": "Bun", "db": "Postgres", "orm": "Drizzle", "ui": "shadcn + Base UI", "styling": "Tailwind CSS", "queue": "BullMQ + Redis" },
      "defaults": { "testing": "tests-required" } }
  ]
}
```

`resolveArchetype(name)` = look up the archetype → seed `projectType`, `tags`, `stack`, and `testing.policy` into the project's `config.json`. Stack-specific skill names (hono-api, drizzle-postgres, …) are referenced here for when those skills are added; they don't need to exist yet.
