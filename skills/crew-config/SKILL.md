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
    "depth": "normal",                 // "light" | "normal" | "deep"
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
  "projectType": null,
  "tags": [],
  "stack": {}
}
```

Auto model tiers: planning/review → strongest, execution/simplify → mid, trivial → cheap. `manual` uses the per-type ids. Override precedence: ad-hoc > project > global > built-in default.

**`language.files`** sets the language of the project files crew writes (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md`, `plans/`). Default `"en"`; ask the user at `/crew:setup` (global) or `/crew:init` (per project). This is separate from the *conversation* language (see `crew-conventions`): the plugin repo and config keys stay English, but the user's own project files may be written in their language.

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
