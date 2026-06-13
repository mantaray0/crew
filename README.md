# crew

[![CI](https://github.com/mantaray0/crew/actions/workflows/ci.yml/badge.svg)](https://github.com/mantaray0/crew/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-7C3AED.svg)](https://www.claude.com/product/claude-code)

A config-driven agentic workflow harness for **Claude Code** — distributed as a pure plugin
(commands, agents, skills, hooks). Lightweight planning, strong cross-session context handling,
a configurable verify pipeline, model management, parallel dispatch, and self-learning.

**No CLI, no build, no npm at runtime.** Claude runs everything through the plugin. Project
state lives in a committed `.planning/` directory; behavior is driven by a layered `config.json`.

---

## Table of contents

- [What crew is](#what-crew-is)
- [Install](#install)
- [Quick start](#quick-start)
- [The core loop](#the-core-loop)
- [Commands](#commands) — all 19, in detail
  - [Setup & onboarding](#setup--onboarding): `setup` · `init` · `update`
  - [Shaping work](#shaping-work): `brief` · `plan` · `backlog` · `adjust` · `pull`
  - [Execution](#execution): `execute` (`auto` · `dispatch`) · `quick`
  - [Quality](#quality): `verify` · `rollback`
  - [Orientation](#orientation): `status` · `resume` · `report`
  - [Learning](#learning): `retro`
- [The `.planning/` directory](#the-planning-directory)
- [Configuration](#configuration)
- [Architecture](#architecture): commands, agents, skills, hooks
- [Concepts in depth](#concepts-in-depth)
- [Contributing](#contributing)
- [License](#license)

---

## What crew is

crew turns Claude Code into a disciplined engineering teammate that keeps its own project memory.
Instead of one-off prompts, you move work through a small, predictable lifecycle:

> **clarify → plan → execute → verify → commit → learn**

Everything crew knows about your project is plain Markdown and JSON in a `.planning/` folder that
lives **in your repo and is committed**. That means context survives across sessions, machines, and
teammates — and a fresh Claude session can pick up exactly where the last one stopped.

What makes it more than a prompt collection:

- **Cross-session context.** A living `PROJECT.md` + `ROADMAP.md` + `LOG.md`, plus per-session
  snapshots, so `/crew:resume` reconstitutes full context in a clean window.
- **A configurable verify pipeline.** Every change can pass through `verify → review → harden →
  simplify`, each in a fresh sub-agent context with the right model.
- **Model management.** Cheap models for trivial work, strong models for planning/review — chosen
  automatically or pinned per task type.
- **Parallel dispatch.** Independent phases run concurrently in isolated git worktrees and roll up
  through an integration branch.
- **Self-learning.** `/crew:retro` distills reusable patterns into skills/tags in your global
  registry, so knowledge compounds across projects instead of getting stranded in one repo.

---

## Install

```
/plugin marketplace add mantaray0/crew
/plugin install crew@mantaray0
```

That's it — no build step and no runtime dependencies. (The repo's `package.json`/pnpm setup exists
only for maintainers: changesets-based releases. Users never install anything but the plugin.)

---

## Quick start

```
/crew:setup     # one-time, global: define your project types/tags + cross-project defaults
/crew:init      # per project: pick a project type, capture the stack, scaffold .planning/
/crew:brief     # clarify an idea or feature (Roast-Me questioning)
/crew:plan      # turn the brief into a roadmap + detailed plan files
/crew:execute      # execute the next phase (verify pipeline + atomic commit)
/crew:status    # where are we?
/crew:resume    # orient a fresh session
```

`/crew:setup` is run once per machine. `/crew:init` is run once per repository. After that, your
day-to-day is mostly `brief → plan → execute`, with `status`/`resume` to orient and `adjust`/`backlog`
to stay fluid.

---

## The core loop

```
        ┌───────────────┐
        │  /crew:brief  │  clarify intent (Roast-Me)
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  /crew:plan   │  roadmap (milestones → phases) + plan files
        └───────┬───────┘
                ▼
        ┌───────────────┐      independent phases?
        │ /crew:execute │ ──────────────────────▶ /crew:execute dispatch (parallel worktrees)
        └───────┬───────┘
                ▼
   verify → review → harden → simplify   (/crew:verify, runs inside execute)
                ▼
        atomic commit + LOG.md update
                ▼
        ┌───────────────┐
        │ /crew:retro   │  distill learnings into the global registry
        └───────────────┘
```

`status`, `resume`, `report`, `adjust`, `backlog`, `rollback`, `quick`, and `pull` orbit this loop
as support commands.

---

## Commands

All 19 commands live in `commands/*.md` and are invoked as `/crew:<name>`. Every command follows the
`crew-conventions` skill: it **surfaces every decision** (free-text / single-select / multi-select),
**batches the independent ones** into a stepper and stays sequential on dependencies, **never silently
applies a default** (it shows the default as the recommended choice), and **responds in your language**
while keeping repo content in English.

### Setup & onboarding

#### `/crew:setup`
> One-time **global** setup. Defines the project types and tags that apply across *all* your repos
> and writes the global layer under `~/.claude/crew/`.

- Ensures `~/.claude/crew/` exists.
- Walks you through the **registry** (`project-types.json`): the starter archetypes (`app`,
  `api-service`, `cli`, `marketing-site`, `monorepo`) and tags (`nextjs`, `hono`, `drizzle`,
  `postgres`, `tailwind`, `auth`, …). You add / rename / remove until it matches how you actually
  work, then it's written only after you confirm.
- Optionally writes a **global `config.json`** — going through each config group (`models`, `git`,
  `notifications`, `tasks.provider`, `execution`, `language.files`, …) one at a time, asking
  "keep default vs override". Only the values you confirm are written; everything else stays a
  built-in default.

Run this once per machine. Backed by the `crew-config` and `crew-conventions` skills.

#### `/crew:init`
> Per-project setup. Picks a project type, captures the stack, and scaffolds the committed
> `.planning/` directory.

- **Guard:** if `.planning/` already exists it stops (overwrite only on request).
- **Pick a project type** from your global registry (or the starter archetypes), or "decide later".
  The chosen archetype seeds `tags`, `stack`, and `testing.policy`.
- **Stack interview:** confirm/adjust DB, frontend, UI, backend-API, queue, deploy — pre-filled from
  the archetype and your defaults, with the escape hatch "you decide → I propose → you approve".
- **Scaffolds** `.planning/` with `config.json`, an empty `PROJECT.md`/`ROADMAP.md`/`LOG.md`/
  `BACKLOG.md`, and the `plans/` + `sessions/` directories.

Run this once per repo. Backed by `crew-config`, `roast-me`, and `crew-conventions`.

#### `/crew:update` &nbsp;`[project | global, optional]`
> Reconcile an existing config against the current plugin's schema.

- Compares the config's `crewVersion` against the plugin version and walks any new/changed keys,
  asking before writing — a set value is never silently overwritten.
- Defaults to the **project** config; `global` reconciles `~/.claude/crew/` instead (empty arg offers
  both). Delegates to the `crew-config` reconcile procedure.

### Shaping work

#### `/crew:brief` &nbsp;`[free-form idea or feature description]`
> The entry point. Turns a raw idea into a clarified brief **before** any planning.

- Reads `.planning/PROJECT.md` if present (so it knows this is a feature inside an existing project
  vs. a brand-new project).
- Runs **Roast-Me clarification** (`roast-me` skill): sharp questions one at a time, each carrying a
  recommended answer you can just confirm. Honors `config.clarify.depth` (`light`/`normal`/`deep`).
  When a question is answerable from the codebase, it investigates instead of asking.
- For a new project, captures the stack and writes `PROJECT.md`. For a feature, writes the **Spec
  head** of a plan file. Stops when shared understanding is reached.

#### `/crew:plan` &nbsp;`[feature/plan slug, optional]`
> Turns a clarified brief into an executable plan: a roadmap of milestones → phases, plus detailed
> plan files. **Waits for your approval before any execution.**

- Reads `PROJECT.md`, the relevant plan's Spec head, `ROADMAP.md`, and `BACKLOG.md`.
- **Triages the backlog** — surfaces relevant ideas and asks (multi-select) which to fold in now.
- Drafts/extends `ROADMAP.md` as milestones → phases with status markers
  `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred, keeping phases **independently mergeable**
  and recording inter-phase `depends:` edges (used later for parallel dispatch).
- Writes per-plan files under `.planning/plans/`. Backed by `crew-planning` + `crew-conventions`.

#### `/crew:backlog` &nbsp;`[idea text | list | new | empty → ask & add]`
> A frictionless idea inbox so the active plan stays undisturbed and nothing gets lost.

- **`<text>`:** appends a dated bullet to `BACKLOG.md` (`- [YYYY-MM-DD] <idea>`) and does nothing
  else — no planning, no interrupting the active phase. One-line confirmation.
- **empty or `new`:** prompts you for the idea, then adds it the same way.
- **`list`:** lists the backlog and offers, per item, to plan now (hand to `plan`/`adjust`), keep
  parked, or drop.

#### `/crew:adjust` &nbsp;`[what to change, free-form]`
> Change the roadmap mid-flight — insert, reorder, defer, or drop phases — without renumbering pain.

- Reads `ROADMAP.md` + `BACKLOG.md`.
- Applies the change as a plain Markdown edit. Phases are identified by **text/heading, not rigid
  numbers**, so there's no global renumber; status markers and completion timestamps of untouched
  phases are preserved. Can also pull a backlog idea straight into the roadmap.

#### `/crew:pull` &nbsp;`<task id>`
> Pull a work item from an external PM tool (or the local roadmap) into a crew plan.

- Resolves `config.tasks.provider` (`local` · `mcp:linear` · `mcp:jira` · `mcp:clickup` · `crew-pm`).
- Fetches the ticket and normalizes it to `{ id, title, description, acceptanceCriteria, status,
  externalRef }`.
- Writes `.planning/plans/<id>.md` with the Spec head filled from the ticket and `externalRef: <id>`,
  and adds a roadmap entry. **The ticket is the spec** — it won't re-run Roast-Me unless the ticket is
  too thin. `.planning/` stays the working layer; the external ticket is the north-star + sync
  boundary.

### Execution

#### `/crew:execute` &nbsp;`[phase id | auto | dispatch [ids]]`
> The execution verb, with three modes. **Default** (a phase id or empty) runs **one** phase to
> completion: load context → implement → verify → commit. **`auto`** is the manual mode automated —
> a sequential, autonomous milestone run. **`dispatch`** fans phases out across parallel worktrees.

1. **Load context** — `PROJECT.md`, `ROADMAP.md` (the active `[>]` phase, else the next `[ ]`), the
   phase's plan file, and the tail of `LOG.md`. The exact next step must be unambiguous; if it isn't,
   it asks.
2. **Claim the phase** — marks it `[>]` and records the claim in `claims.json` so parallel instances
   don't collide.
3. **Implement** — exactly what the plan specifies, mirroring existing patterns. Model =
   `config.models.execution` (or auto). **Deviation handling** (`execution.onDeviation`): small,
   in-intent deviations are decided autonomously and noted in the log; a real problem, ambiguity, or
   scope change → **stop and ask**.
4. **Verify** — runs the verify pipeline per `config.verify`.
5. **Commit** — one atomic commit per verified phase, then updates `ROADMAP.md` (`[x]`) and `LOG.md`.

If `config.execution.parallel` is `auto` and independent phases are detected, it offers to hand off
to `/crew:execute dispatch`. Backed by `crew-context` + `crew-planning`.

**`auto` — sequential autonomous run.** Runs a phase in the main context, then `/clear` +
`/crew:execute auto`, carrying continuity through `.planning/` state (no sub-agents). Loops until the
milestone is done or a stop condition is hit; never self-ships or self-completes — reports and
proposes the next step.

**`dispatch [ids]` — parallel worktree run.** Builds the DAG from the milestone's phases and their
`depends:` edges, computes waves of independent phases, confirms the split, then dispatches a wave
(up to `config.execution.maxConcurrent` phases, each in an isolated worktree worked by a sub-agent).
The `merge-coordinator` agent rolls completed branches into an integration branch with intent-aware
conflict resolution. Backed by `crew-planning` (DAG) + `git-merge`, plus the `merge-coordinator` agent.

#### `/crew:quick` &nbsp;`<what to do>`
> The quick lane: a small fix or chore that shouldn't go through the full brief→plan→execute flow and
> shouldn't disturb in-flight work.

- **Scope check** — if it's actually a feature, it says so and routes you to `/crew:brief`.
- **Doesn't disturb active work** — won't touch claimed phases or in-flight worktrees; if isolation
  is favored and the tree is busy, it works on a short-lived branch/worktree.
- Implements directly, optionally runs a light verify, and can commit.

### Quality

#### `/crew:verify` &nbsp;`[phase id or 'diff', optional]`
> Explicitly run the verification pipeline (it also runs automatically inside `/crew:execute`).

1. **Scope** — the current uncommitted diff, or a named phase's change.
2. **Resolve steps** — from `config.verify.default`, default `["verify","review","harden","simplify"]`,
   with optional per-phase overrides.
3. **Run each step in a fresh sub-agent context**, picking the model per `config.models`:
   - **verify** — does it do what the phase intended? (tests/build/behavior)
   - **review** — logic errors, edge cases, convention drift (language-specific reviewer agents)
   - **harden** — hunt swallowed errors and weak type design (`silent-failure-hunter`,
     `type-design-analyzer`)
   - **simplify** — tidy without changing behavior (`code-simplifier`)

Backed by the `verification-loop` skill.

#### `/crew:rollback` &nbsp;`[phase id or commit, optional]`
> Undo a botched phase. Atomic per-phase commits make this cheap.

- Identifies the target (last verified phase commit from `LOG.md`/git, or the one you name) and shows
  what will be undone.
- **Confirms** before acting (reverting changes state).
- Prefers `git revert` to preserve history; uses reset only if you explicitly want history rewritten
  and the commits aren't shared. Leaves the working tree clean.

### Orientation

#### `/crew:status`
> Read-only snapshot of the current project state. Modifies nothing.

- If `.planning/` is missing, points you to `/crew:init`.
- Reports per milestone: phases done `[x]`, active `[>]`, pending `[ ]`, deferred `[~]`, including
  any `@worktree` claim markers.
- Shows the last few `LOG.md` lines (incl. token/cost notes if present).

#### `/crew:resume`
> Pick up exactly where the last session left off, in a clean context.

- **Loads** `PROJECT.md`, the most recent snapshot in `.planning/sessions/` (newest across any
  worktree subdir), the active phase in `ROADMAP.md`, and the tail of `LOG.md`.
- **Briefs** you with a structured summary: what we're building, where we are, and the precise next
  step — then waits. The companion to the `PreCompact`/`SessionStart` hooks. Backed by `crew-context`.

#### `/crew:report`
> A compact token/cost + progress report aggregated from `LOG.md`.

- Counts completed phases and sums the `~<n>k tok` and `$<x>` entries into totals, when
  `config.observability.trackCost` is on.

### Learning

#### `/crew:retro` &nbsp;`[phase/milestone, optional]`
> Make the harness learn from completed work so knowledge compounds across projects.

1. **Gather** recent `LOG.md` entries, the diffs of completed phases, and `PROJECT.md` decisions.
2. **Distill** recurring patterns into a proposed **skill** (reusable procedure), a **tag** (a
   capability that activates skills/rules), or a `PROJECT.md` decision update.
3. **Propose, don't impose** — each proposal is presented for explicit confirmation before anything is
   written to your global registry. Active when `config.learn.enabled`. Backed by `crew-learn`.

### Release & lifecycle

#### `/crew:ship` &nbsp;`[environment, optional]`
> Carry a verified change to a release — version, commit, tag, push, PR, and (when enabled) deploy.

Driven by `config.deploy` (`enabled` + `runDeploy`); **`config.git` is the single git authority** — ship
never pushes, opens a PR, or commits in a way your git config disables; it asks instead:

1. **Read config** — `config.deploy`, `config.git`, and `reference/deploy.md`. If `deploy.enabled` is
   `false`, it explains how to enable it and stops.
2. **Gate on verify** — refuses to ship on a red `verify` (checks the last result in `LOG.md`).
3. **Release per `deploy.releaseTool`** — `changesets`/`release-please` (push a changeset/commits; a CI
   bot opens the version-PR), `semantic-release` (push; CI does it all), or `manual` (local bump → commit
   → tag with your `commitStyle`/`deploy.tagPattern`). `auto` detects the tool from the repo.
4. **Push & PR** — only if `git.autoPush` / `git.autoPR` allow it (otherwise it asks); PR/MR via the
   `gh` (GitHub Actions) or `glab` (GitLab CI) CLI. In a push-triggered setup the push is the deploy
   trigger, so it stays the user's call.
5. **Deploy** — only when `deploy.runDeploy` is `ask`/`auto`: runs the imperative deploy command from
   `reference/deploy.md` for the target environment (confirmation on `ask`). Never guessed by crew.
6. **Record** — appends the version, tag, and push/PR/deploy outcome to `LOG.md`.

`runDeploy` defaults to `off` — in a push-triggered setup the push from step 4 *is* the deploy, so
there's nothing extra to run. Set it to `ask`/`auto` only for imperative deploys (Vercel/Fly). For
bot-PR tools, `deploy.finishRelease` (default `off`) controls whether ship also merges the open
version-PR to finish the release. Backed by `crew-deploy`.

#### `/crew:archive` &nbsp;`[milestone slug, optional]`
> Move a fully completed milestone into `.planning/archive/` so the live roadmap stays small and cheap to read.

- **Targets** the slug you name, or the latest **fully completed** milestone.
- **Guardrail** — only milestones whose phases are **all `[x]`** archive; if any phase is open it lists
  them and stops.
- **Moves** (a pure `mv` + text edit, no content change): the `ROADMAP.md` section →
  `.planning/archive/roadmap-<slug>.md`, and `plans/<slug>/` → `.planning/archive/plans/<slug>/`.
- **Leaves** a one-line pointer in `ROADMAP.md` (`✓ archiviert YYYY-MM-DD → archive/…`). `LOG.md` is
  never archived — it stays append-only. Backed by `crew-planning`.

#### `/crew:complete-milestone` &nbsp;`[milestone slug, optional]`
> The richer milestone close-out — audit, summarize, then archive. Wraps `/crew:archive`.

1. **Audit** — verifies every phase of the milestone is `[x]`; if not, lists the open ones and stops
   (finish via `/crew:execute` or defer via `/crew:adjust`).
2. **Summarize** — appends a milestone summary to `LOG.md` (what shipped, key decisions, rolled-up
   token/cost when `observability.trackCost` is on).
3. **Update `PROJECT.md`** — refreshes the current-state section for the completed milestone.
4. **Archive** — runs the `/crew:archive` move for the milestone. Backed by `crew-context` +
   `crew-planning`.

---

## The `.planning/` directory

crew's entire project memory is here, committed with your code. Naming is deliberate: **documents are
UPPERCASE** (like `README`/`CHANGELOG`), **data files and directories are lowercase**.

```
.planning/
├── PROJECT.md        # what we're building + key decisions (the living north-star)
├── ROADMAP.md        # milestones → phases with status markers + depends: edges
├── LOG.md            # append-only execution log (phases, deviations, token/cost)
├── BACKLOG.md        # dated idea inbox (/crew:backlog)
├── config.json       # project-layer config (overrides global + defaults)
├── claims.json       # which phase is claimed by which worktree (parallel safety)
├── plans/            # one folder per milestone
│   └── <milestone-slug>/     # the milestone's plan files
│       ├── _spec.md          # spec root: Spec head only (from /crew:brief)
│       └── <id>-<title>.md   # numbered phase plan (from /crew:plan), e.g. 1.2-db-schema.md
├── archive/          # completed milestones moved out of live state (/crew:archive)
│   ├── roadmap-<slug>.md     # the archived milestone's roadmap section
│   └── plans/<slug>/         # its plan folder, moved verbatim
├── reference/        # load-on-demand knowledge docs (indexed in PROJECT.md ## Reference)
│   └── <topic-slug>.md       # runbooks, domain maps, deep-dives — never auto-loaded
└── sessions/         # session snapshots for resume (per worktree id)
    └── <worktree-id>/<snapshot>.md
```

Status markers used in `ROADMAP.md`: `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred.

---

## Configuration

Behavior is controlled by `config.json`, resolved as a layered merge:

```
built-in defaults  <  ~/.claude/crew/config.json (global)  <  .planning/config.json (project)
```

with ad-hoc overrides (e.g. a per-phase verify override) winning over all of them. The full schema is
the source of truth in the **`crew-config`** skill; here are the groups and their defaults:

| Group | Key defaults | What it controls |
|---|---|---|
| `git` | `autoCommitPerPhase: true`, `autoPush: false`, `isolation: "worktree-per-feature"`, `mergeStrategy: "integration-branch"` | Commit/branch/merge behavior; never touches the remote without approval |
| `execution` | `parallel: "auto"`, `maxConcurrent: 3`, `onDeviation: "small-self-major-ask"` | Parallelism and how deviations are handled |
| `verify` | `default: ["verify","review","harden","simplify"]`, `perPhaseOverride: true` | The verification pipeline |
| `models` | `mode: "auto"`; planning/review→`opus`, execution/simplify→`sonnet`, trivial→`haiku` | Model per task type (auto tiers or manual pins) |
| `clarify` | `depth: "normal"`, `askOnlyWhenStuck: true` | How hard Roast-Me pushes |
| `tasks` | `provider: "local"`, `writeBack: false` | External PM integration for `/crew:pull` |
| `testing` | `policy: "from-archetype"` | TDD / tests-required / optional |
| `security` | `auto: false` | Security pass is **never** automatic — recommended on sensitive scope, run only on approval |
| `notifications` | `enabled: true`, `events: ["blocker","completion"]`, `channel: "os"` | Desktop/push notifications (see hooks) |
| `learn` | `enabled: true` | `/crew:retro` self-learning |
| `language` | `files: "en"` | Language of generated project files (separate from conversation language) |
| `responseStyle` | `"concise"` | Verbosity/format of replies: `concise` (short, tables) · `detailed` (full prose) · `auto` |
| `crewVersion` | set on init | Plugin version the config was last reconciled with — drives the update flow |

**Model auto tiers:** planning/review → strongest, execution/simplify → mid, trivial → cheap.
Override precedence: ad-hoc > project > global > built-in default.

**Staying current.** `crewVersion` records the plugin version a config was reconciled with. On session
start crew warns if a project's config is behind the installed plugin; re-running `/crew:init`
(project) or `/crew:setup` (global) enters a **reconcile mode** that schema-diffs the existing config
and asks you about each new field rather than silently applying defaults.

**Registry (`project-types.json`, global layer):** a **tag** is atomic and activates skills/rules; a
**project type (archetype)** is a curated tag bundle + defaults. Picked at `/crew:init`; the resolved
tag-set drives which rules/skills are active. Starter archetypes: `app`, `api-service`, `cli`,
`marketing-site`, `monorepo`.

---

## Architecture

crew is a **pure Claude Code plugin** — four asset types, no build, no runtime code beyond three Node
hook scripts.

### Commands (`commands/*.md`)
The 19 slash commands above. Each is a Markdown file with a `description` (+ `argument-hint`) and a
numbered `## Steps` recipe that Claude follows.

### Agents (`agents/*.md`)
Specialist sub-agents the commands dispatch into fresh contexts. Each declares a task-type so
`model-management` can pick a model.

| Agent | Role |
|---|---|
| `architect` | Break features into phases, design data flow, choose an approach grounded in the codebase |
| `code-explorer` | Read-only investigator: trace execution paths, map architecture, document conventions |
| `code-reviewer` | General code-quality review (the pipeline's review stage) |
| `typescript-reviewer` | TS idioms, async correctness, module boundaries, API ergonomics |
| `react-reviewer` | React/Next.js: hooks rules, render correctness, server/client boundaries, TanStack Query |
| `database-reviewer` | Drizzle/Postgres: schema, migrations, queries, indexes, transactions |
| `security-reviewer` | Security pass for auth/payments/tokens/input — only when recommended **and** approved |
| `code-simplifier` | Simplify/tidy without changing behavior (the simplify stage) |
| `silent-failure-hunter` | Hunt swallowed errors, ignored returns, empty catches (the harden stage) |
| `type-design-analyzer` | Make illegal states unrepresentable; surface `any`/unsafe casts (the harden stage) |
| `build-error-resolver` | Fix build/typecheck/lint failures when the toolchain is red |
| `merge-coordinator` | Integrate parallel worktrees with intent-aware conflict resolution (during `execute dispatch`) |

### Skills (`skills/*/SKILL.md`)
The reusable knowledge the commands lean on:

| Skill | Used by |
|---|---|
| `crew-conventions` | **Every** command — the one-decision-at-a-time interaction + language rules |
| `crew-config` | `setup`, `init`, `update` — config schema + project-type/tag registry |
| `crew-context` | `execute`, `resume` — the `.planning/` state model + session-snapshot format |
| `crew-planning` | `plan`, `execute`, `adjust` — roadmap/phase/spec conventions + DAG |
| `verification-loop` | `verify`, `execute` — the verify→review→harden→simplify pipeline |
| `model-management` | `execute dispatch` + pipeline — task-types and model selection |
| `git-merge` | `execute dispatch` — worktree isolation, claims, rolling integration |
| `roast-me` | `brief`, `init` — bounded clarifying questions with recommended answers |
| `crew-learn` | `retro` — distilling work into proposed skills/tags |

### Hooks (`hooks/`)
Three Node scripts wired in `hooks/hooks.json`:

- **`SessionStart` → `session-start.mjs`** — primes a new session with crew context.
- **`PreCompact` → `pre-compact.mjs`** — writes a session snapshot before context is compacted, so
  `/crew:resume` can recover.
- **`Notification` → `notify.mjs blocker`** and **`Stop` → `notify.mjs completion`** — fire desktop/
  push notifications on blockers and completions, per `config.notifications`.

---

## Concepts in depth

**Cross-session continuity.** The `PreCompact` hook snapshots state before compaction; `SessionStart`
re-primes; `/crew:resume` reconstitutes. Because `.planning/` is committed, this works across
machines and teammates — not just within one chat.

**The verify pipeline.** `verify → review → harden → simplify`, each in a *fresh* sub-agent context
so reviewers aren't biased by the implementer's reasoning, and each with a model chosen for its task
type. Steps are configurable globally and per-phase.

**Parallelism without chaos.** `depends:` edges in `ROADMAP.md` form a DAG; `/crew:execute dispatch`
runs independent phases in isolated worktrees, `claims.json` prevents collisions, and the
`merge-coordinator` performs intent-aware integration. Atomic per-phase commits make `/crew:rollback`
trivial.

**Self-learning.** `/crew:retro` lifts patterns out of one repo into your global registry as skills
and tags — so the next project starts smarter. Nothing is written without your explicit confirmation.

**Safety defaults.** crew never pushes, opens PRs, or runs a security pass automatically. State-
changing actions are confirmed; the security pass requires both a recommendation and your approval.

See `docs/specs/2026-06-12-crew-harness-core-design.md` for the full design rationale.

---

## Contributing

Contributions are welcome — most changes are just editing a Markdown command, agent, or skill. See
[CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md). Releases follow the
changesets flow in [docs/RELEASING.md](docs/RELEASING.md). Found a security issue? See
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Daniel Baumert
