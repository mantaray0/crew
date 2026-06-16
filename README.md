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
- [Commands](#commands) — all 22, in detail
  - [Setup & onboarding](#setup--onboarding): `setup` · `init` · `update`
  - [Shaping work](#shaping-work): `brief` · `plan` · `backlog` · `adjust` · `pull`
  - [Execution](#execution): `execute` (`auto` · `dispatch`) · `quick`
  - [Quality](#quality): `verify` · `rollback`
  - [Orientation](#orientation): `status` · `resume` · `report`
  - [Learning](#learning): `learn`
  - [Release & lifecycle](#release--lifecycle): `ship` · `archive` · `complete` · `finish`
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

> **brief → plan → execute → verify → finish** (ship · learn · complete)

Everything crew knows about your project is plain Markdown and JSON in a `.planning/` folder that
lives **in your repo and is committed**. That means context survives across sessions, machines, and
teammates — and a fresh Claude session can pick up exactly where the last one stopped.

What makes it more than a prompt collection:

- **Cross-session context.** A living `PROJECT.md` + `ROADMAP.md` + `LOG.md`, so `/crew:resume`
  reconstitutes full context in a clean window.
- **A configurable verify pipeline.** Every change can pass through `test → smoke → review → harden →
  simplify`, each in a fresh sub-agent context with the right model.
- **Model management.** Cheap models for trivial work, strong models for planning/review — chosen
  automatically or pinned per task type.
- **Parallel dispatch & opt-in isolation.** Independent phases run concurrently in isolated git
  worktrees — intrinsic to `dispatch` — and roll up through an integration branch.
  **Milestone isolation** is additionally **opt-in** (off by default) — one worktree+branch per milestone, so
  different people/agents can take a milestone in parallel — forking from a configurable
  `git.baseBranch` (e.g. a long-lived `redesign` branch) instead of hardcoded `main`.
- **Self-learning.** `/crew:learn` distills reusable patterns into skills/tags in your global
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
/crew:execute   # execute the next phase (verify pipeline + atomic commit)
/crew:finish    # close out the milestone: ship · learn · complete
/crew:status    # where are we?
/crew:resume    # orient a fresh session
```

`/crew:setup` is run once per machine. `/crew:init` is run once per repository. After that, your
day-to-day is mostly `brief → plan → execute`, closing each milestone with `finish`, and using
`status`/`resume` to orient and `adjust`/`backlog` to stay fluid.

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
   test → smoke → review → harden → simplify   (/crew:verify, runs inside execute)
                ▼
        atomic commit + LOG.md update
                │
                ▼  per milestone
        ┌───────────────┐
        │ /crew:finish  │  orchestrator — close out a milestone, each step gated by its run:
        └───────────────┘
              ├─ ship      → /crew:ship       version · tag · push · release
              ├─ learn     → /crew:learn      distill patterns → global registry
              └─ complete  → /crew:complete   audit · summarize · PROJECT.md · archive (wraps /crew:archive)
```

`execute` runs at three granularities: the **phase loop** (`one` vs `auto`), the **strategy**
(sequential vs `dispatch` parallel worktrees), and `workflow.mode` (`manual` stops at the milestone
boundary and *suggests* `finish`; `auto` chains into it). The close-out always runs in the fixed order
**Ship → Learn → Complete**, and **`finish` is the orchestrator that bundles all three** — each step is
also runnable on its own.

`status`, `resume`, `report`, `adjust`, `backlog`, `rollback`, `quick`, and `pull` orbit this loop
as support commands.

### Command map

| Level | Command(s) | Role |
|---|---|---|
| **Orchestrator** | `/crew:finish` | Runs the close-out **Ship → Learn → Complete** in order, each step gated by its `run`; delegates every step to its own command, invents no logic. |
| **Single steps** | `/crew:ship` · `/crew:learn` · `/crew:complete` | Each runnable on its own. ship = release; learn = distill patterns; complete = the full milestone close-out (audit → summarize → `PROJECT.md` → archive). |
| **Primitive** | `/crew:archive` | The mechanical move (folder `mv` + `_roadmap.md`); `/crew:complete` calls it as its last step. Stays usable on its own for pure tidy-up — **not** an alias of complete. |

---

## Commands

All 20 commands live in `commands/*.md` and are invoked as `/crew:<name>`. Every command follows the
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
  `notifications`, `tasks.provider`, `execute`, `language.files`, …) one at a time, asking
  "keep default vs override". Only the values you confirm are written; everything else stays a
  built-in default.

Run this once per machine. Backed by the `crew-config` and `crew-conventions` skills.

#### `/crew:init`
> Per-project setup. Picks a project type, captures the stack, and scaffolds the committed
> `.planning/` directory.

- **Guard:** if `.planning/` already exists it stops (overwrite only on request).
- **Pick a project type** from your global registry (or the starter archetypes), or "decide later".
  The chosen archetype seeds `tags`, `stack`, and `testingPolicy`.
- **Stack interview:** confirm/adjust DB, frontend, UI, backend-API, queue, deploy — pre-filled from
  the archetype and your defaults, with the escape hatch "you decide → I propose → you approve".
- **Scaffolds** `.planning/` with `config.json`, an empty `PROJECT.md`/`ROADMAP.md`/`LOG.md`/
  `BACKLOG.md`, and the `plans/` directory.

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
  recommended answer you can just confirm. Honors `config.workflow.brief.depth` (`light`/`normal`/`deep`).
  When a question is answerable from the codebase, it investigates instead of asking.
- For a new project, captures the stack and writes `PROJECT.md`. For a feature, writes the milestone's
  permanent **`_spec.md`** (its single source of intent). Stops when shared understanding is reached.

#### `/crew:plan` &nbsp;`[feature/plan slug, optional]`
> Turns a clarified brief into an executable plan: a roadmap of milestones → phases, plus detailed
> plan files. **Waits for your approval before any execution.**

- Reads `PROJECT.md`, the relevant milestone's `_spec.md`, `ROADMAP.md`, and `BACKLOG.md`.
- **Triages the backlog** — surfaces relevant ideas and asks (multi-select) which to fold in now.
- Drafts/extends `ROADMAP.md` as milestones → phases with status markers
  `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred, keeping phases **independently mergeable**
  and recording inter-phase `depends:` edges (used later for parallel dispatch).
- Writes per-plan files under `.planning/plans/`. Backed by `planning` + `crew-conventions`.

#### `/crew:backlog` &nbsp;`[idea text | list | new | empty → ask & add]`
> A frictionless idea inbox so the active plan stays undisturbed and nothing gets lost.

- **`<text>`:** appends a dated bullet to `BACKLOG.md` (`- [YYYY-MM-DD] <idea>`) and does nothing
  else — no planning, no interrupting the active phase. One-line confirmation.
- **empty or `new`:** prompts you for the idea, then adds it the same way.
- **`list`:** lists the backlog and offers, per item: **do it now (promote)** — routed by size
  (small → `/crew:quick`, with **no roadmap entry** · feature → `/crew:brief`/`plan` · roadmap-worthy →
  `/crew:adjust`) — **plan it**, **keep parked**, or **drop**. Promoting closes the gap from "captured"
  to "in work" without the roadmap detour; the promoted item then leaves `BACKLOG.md`.

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
- Writes `.planning/plans/<id>.md` with the ticket's spec filled in inline and `externalRef: <id>`,
  and adds a roadmap entry. **The ticket is the spec** — it won't re-run Roast-Me unless the ticket is
  too thin. `.planning/` stays the working layer; the external ticket is the north-star + sync
  boundary.

### Execution

#### `/crew:execute` &nbsp;`[phase id | auto | dispatch [ids]]`
> The execution verb, with three modes. **Default** (a phase id or empty) runs **one** phase to
> completion: load context → implement → verify → commit. **`auto`** is the manual mode automated —
> a sequential, autonomous milestone run. **`dispatch`** fans phases out across parallel worktrees.

1. **Load context** — `PROJECT.md`, `ROADMAP.md` (the active `[>]` phase, else the next `[ ]`), the
   phase's plan file, and the tail of `LOG.md`. The exact next step must be unambiguous; if the
   milestone is done and the next is unplanned it routes you to `/crew:plan`/`/crew:resume`, otherwise
   it asks.
2. **Milestone-boundary guard, then claim** — at a milestone boundary (the previous milestone fully
   done) it pauses and offers `/crew:finish` first (you can skip; it never self-finishes),
   then marks the phase `[>]` and records the claim in `claims.json` so parallel instances don't collide.
3. **Implement** — exactly what the plan specifies, mirroring existing patterns. Model =
   `config.models.execution` (or auto). **Deviation handling** (`workflow.execute.onDeviation`): small,
   in-intent deviations are decided autonomously and noted in the log; a real problem, ambiguity, or
   scope change → **stop and ask**.
4. **Verify** — runs the verify pipeline per `config.workflow.execute.verify`.
5. **Commit** — one atomic commit per verified phase, then updates `ROADMAP.md` (`[x]`) and `LOG.md`.

The three "auto" granularities are distinct fields: the **phase loop** (`workflow.execute.loop` `one|all`,
the `auto` argument), the **strategy** (`workflow.execute.parallel`, the `dispatch` argument), and the
**step chain** (`workflow.mode`; see *Configuration*). If `config.workflow.execute.parallel` is `auto` and
independent phases are detected, it offers to hand off to `/crew:execute dispatch`. Backed by `crew-context`
+ `planning`.

**`auto` — sequential autonomous run.** Runs a phase in the main context, then `/clear` +
`/crew:execute auto`, carrying continuity through `.planning/` state (no sub-agents). Loops until the
milestone is done or a stop condition is hit; never self-ships, self-completes, or self-finishes —
reports and proposes `/crew:finish` for the close-out.

**`dispatch [ids]` — parallel worktree run.** Builds the DAG from the milestone's phases and their
`depends:` edges, computes waves of independent phases, confirms the split, then dispatches a wave
(up to `config.workflow.execute.maxConcurrent` phases, each in an isolated worktree worked by a sub-agent).
The `merge-coordinator` agent rolls completed branches into an integration branch — targeting
`config.git.baseBranch`, or the **milestone branch** when milestone isolation nests dispatch under it —
with intent-aware conflict resolution. Backed by `planning` (DAG) + `git-merge`, plus the
`merge-coordinator` agent.

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
2. **Resolve steps** — from `config.workflow.execute.verify.default`, default `["test","smoke","review","harden","simplify"]`,
   with optional per-phase overrides.
3. **Run each step in a fresh sub-agent context**, picking the model per `config.models`:
   - **test** — does it do what the phase intended? (tests/build/behavior)
   - **smoke** — run the built app end-to-end (command from `PROJECT.md`); skipped with a note when no smoke/E2E command is defined
   - **review** — logic errors, edge cases, convention drift (language-specific reviewer agents)
   - **harden** — hunt swallowed errors and weak type design (`silent-failure-hunter`,
     `type-design-analyzer`)
   - **simplify** — tidy without changing behavior (`code-simplifier`)

Backed by the `verify` skill.

#### `/crew:rollback` &nbsp;`[phase id or commit, optional]`
> Undo a botched phase. Atomic per-phase commits make this cheap.

- Identifies the target (last verified phase commit from `LOG.md`/git, or the one you name) and shows
  what will be undone.
- **Confirms** before acting (reverting changes state).
- Prefers `git revert` to preserve history; uses reset only if you explicitly want history rewritten
  and the commits aren't shared. Leaves the working tree clean.

### Orientation

#### `/crew:status`
> Read-only view of the current project state. Modifies nothing.

- If `.planning/` is missing, points you to `/crew:init`.
- Reports per milestone: phases done `[x]`, active `[>]`, pending `[ ]`, deferred `[~]`, including
  any `@worktree` claim markers.
- Shows the last few `LOG.md` lines (incl. token/cost notes if present).
- The any-time **dashboard** — "where do we stand?". To *re-enter work* in a fresh session, use
  `/crew:resume` instead (it reads the `LOG.md` history in depth; `status` shows a compact dashboard).

#### `/crew:resume`
> Pick up exactly where the last session left off, in a clean context.

- **Loads** `PROJECT.md`, the active phase in `ROADMAP.md`, and the tail of `LOG.md` (whose latest
  entries carry the recent decisions, deviations, and next step). Continuity rides on the committed
  `.planning/` state — no separate snapshot.
- **Briefs** you with a structured summary — **PROJECT** (what we're building), **STATE** (done /
  in-progress / not-started phases), **DO NOT RETRY** (failed approaches & deviations, always shown),
  and the exact **NEXT STEP** — then waits. The companion to the `SessionStart` hook. Backed by
  `crew-context`.
- The **session bootstrap** (vs. `/crew:status`, the dashboard): `status` answers "where do we stand?",
  `resume` answers "what was I doing, and what's the next move?" — its differentiator is reading the
  `LOG.md` history in depth (the **DO NOT RETRY** + **NEXT STEP** that the compact dashboard never surfaces).

#### `/crew:report`
> A compact token/cost + progress report aggregated from `LOG.md`.

- Counts completed phases and sums the `~<n>k tok` and `$<x>` entries into totals, when
  `config.observability.trackCost` is on.

### Learning

#### `/crew:learn` &nbsp;`[phase/milestone, optional]`
> Make the harness learn from completed work so knowledge compounds across projects.

1. **Gather** recent `LOG.md` entries, the diffs of completed phases, and `PROJECT.md` decisions.
2. **Distill** recurring patterns into a proposed **skill** (reusable procedure), a **tag** (a
   capability that activates skills/rules), or a `PROJECT.md` decision update.
3. **Propose, don't impose** — each proposal is presented for explicit confirmation before anything is
   written to your global registry. Active when `config.workflow.learn.enabled`. Backed by `learn`.

Also the **Learn step** of the `/crew:finish` strand (`config.workflow.learn.run`), where it runs once per
milestone — see `/crew:finish` below.

### Release & lifecycle

#### `/crew:ship` &nbsp;`[environment, optional]`
> Carry a verified change to a release — version, commit, tag, push, PR, and (when enabled) deploy.

Driven by `config.workflow.ship` (`enabled` + `runDeploy`); **`config.git` is the single git authority** — ship
never pushes, opens a PR, or commits in a way your git config disables; it asks instead:

1. **Read config** — `config.workflow.ship`, `config.git`, and `reference/deploy.md`. If `ship.enabled` is
   `false`, it explains how to enable it and stops.
2. **Gate on verify** — refuses to ship on a red `verify` (checks the last result in `LOG.md`).
3. **Release per `ship.releaseTool`** — `changesets`/`release-please` (push a changeset/commits; a CI
   bot opens the version-PR), `semantic-release` (push; CI does it all), or `manual` (local bump → commit
   → tag with your `commitPattern`/`ship.tagPattern`). `auto` detects the tool from the repo.
4. **Push & PR** — only if `git.autoPush` / `git.autoPR` allow it (otherwise it asks); PR/MR via the
   `gh` (GitHub Actions) or `glab` (GitLab CI) CLI. In a push-triggered setup the push is the deploy
   trigger, so it stays the user's call.
5. **Deploy** — only when `ship.runDeploy` is `ask`/`auto`: runs the imperative deploy command from
   `reference/deploy.md` for the target environment (confirmation on `ask`). Never guessed by crew.
6. **Record** — appends the version, tag, and push/PR/deploy outcome to `LOG.md`.

`runDeploy` defaults to `off` — in a push-triggered setup the push from step 4 *is* the deploy, so
there's nothing extra to run. Set it to `ask`/`auto` only for imperative deploys (Vercel/Fly). For
bot-PR tools, `ship.finishRelease` (default `off`) controls whether ship also merges the open
version-PR to finish the release. Backed by `deploy`.

ship is also the **Ship step** of the `/crew:finish` strand (`config.workflow.ship.run`, additionally gated
by `config.workflow.ship.enabled`); finish adds no new push/release axis — it calls this same command.

#### `/crew:archive` &nbsp;`[milestone slug, optional]`
> Move a fully completed milestone into `.planning/archive/` so the live roadmap stays small and cheap to read.

- **Targets** the slug you name, or the latest **fully completed** milestone.
- **Guardrail** — only milestones whose phases are **all `[x]`** archive; if any phase is open it lists
  them and stops.
- **Moves** (a folder `mv` + writing one meta file): `plans/<n>_<slug>/` →
  `.planning/archive/plans/<n>_<slug>/`, with the `ROADMAP.md` section written **into** it as `_roadmap.md`.
- **Leaves** a one-line pointer in `ROADMAP.md` (`✓ archiviert YYYY-MM-DD → archive/…`). `LOG.md` is
  never archived — it stays append-only. Backed by `planning`.

#### `/crew:complete` &nbsp;`[milestone slug, optional]`
> Close out a finished milestone — audit that all phases are done, summarize what shipped, update `PROJECT.md`, then archive it.

- **The full semantic close-out**: **(a)** audit (every phase `[x]` or `[~]`; open `[ ]`/`[>]` blocks)
  → **(b)** summarize the milestone into `LOG.md` → **(c)** update `PROJECT.md` → **(d)** archive.
- **Complete ⊃ Archive** — it calls `/crew:archive` as its last step (delegate, not duplicate);
  `/crew:archive` stays usable on its own for pure tidy-up. They are **not** aliases of each other.
- As the **Complete step** of `/crew:finish` its gate is `config.workflow.complete.run`; invoked
  directly it always runs. Backed by `crew-context` + `planning`.

#### `/crew:finish` &nbsp;`[milestone slug, optional]`
> Close out a milestone end-to-end in one strand: **Ship → Learn → Complete**, each step gated by its `run`.

finish **orchestrates** — it **delegates all three steps** to their own commands (`/crew:ship`,
`/crew:learn`, `/crew:complete`); the **Complete** close-out (audit → summarize → update `PROJECT.md` →
archive, wrapping `/crew:archive`) lives in the standalone `/crew:complete` command. It runs the steps in
that fixed order and invents no logic of its own. Each step's gate is its own
`run` (`off|ask|auto|smart`) in `config.workflow.{ship,learn,complete}` (layered global < project):

| step | default `run` | runs when | resolves to |
|---|---|---|---|
| **Ship** | `ask` | `ship.run ≠ off` **and** `ship.enabled` | a release via `/crew:ship` (never on a red verify — that stops the strand) |
| **Learn** | `ask` | `learn.run ≠ off` **and** `learn.enabled` | `/crew:learn`, once per milestone |
| **Complete** | `ask` | `complete.run ≠ off` | `/crew:complete` — audit → summarize → archive (wraps `/crew:archive`; blocks if any phase is still open) |

`off` skips the step (each step keeps its standalone command usable by hand), `ask` offers it then runs
on confirmation, `auto` runs it without asking, `smart` lets the agent judge whether it's worthwhile.
Whether the strand is *chained* automatically after execute is governed by `workflow.mode`; `config.git`
stays the sole push/PR authority regardless of `run`. Every step ends in exactly one logged outcome —
**ran**, **skipped** (with reason), or **stopped** (a real block: red verify or open phases) — so a
finish run loses no information versus running the steps by hand. `config.git` stays the sole
git authority; finish adds no new push axis, and `/crew:execute` only ever *suggests* finish under
`workflow.mode: manual`, never runs it. Backed by `crew-config` (`config.workflow`) + the delegated command skills.

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
│   └── <n>_<milestone-slug>/ # the milestone's plan files (number-prefixed, e.g. 1_fundament/)
│       ├── _spec.md          # the milestone Spec, permanent (from /crew:brief) — single source of intent
│       └── <id>_<title>.md   # numbered phase plan (from /crew:plan): scope note + _spec.md ref + plan body
├── archive/          # completed milestones moved out of live state (/crew:archive)
│   └── plans/<n>_<slug>/     # its plan folder, moved verbatim
│       ├── _roadmap.md       # the archived milestone's ROADMAP section (written in)
│       ├── _spec.md          # (if the milestone had one)
│       └── <id>_<title>.md   # numbered phase plans
└── reference/        # load-on-demand knowledge docs (indexed in PROJECT.md ## Reference)
    └── <topic-slug>.md       # runbooks, domain maps, deep-dives — never auto-loaded
```

Status markers used in `ROADMAP.md`: `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred.

---

## Configuration

Behavior is controlled by `config.json`, resolved as a layered merge:

```
built-in defaults  <  ~/.claude/crew/config.json (global)  <  .planning/config.json (project)
```

with ad-hoc overrides (e.g. a per-phase verify override) winning over all of them. The full schema is
the source of truth in the **`crew-config`** skill.

**Inheritance is visible in the file.** A fresh `config.json` is written in *full inherit form* — every
inheritable leaf is present, each either a concrete value (a **freeze**) or the sentinel `"inherit"`. The
tri-rule: a concrete value freezes, `"inherit"` dynamically inherits the layer below, and a **missing key
is identical to `"inherit"`** — so older minimal configs keep working unchanged. What each inheriting field
resolves to, and from where, is surfaced by `/crew:status` and the `/crew:update` reconcile report
(`` `language.files`: inherit → `de` (from global) ``). The resolution rule lives in `crew-config` (the source of truth) — this only summarizes it.

**Two levels (so "auto" is never ambiguous).** The workflow steps live under `config.workflow.*`;
cross-cutting config stays top-level. **`workflow.mode`** (`manual|auto`) advances the *step* chain
(brief → … → complete); each gateable close-out step's **`run`** (`off|ask|auto|smart`) decides how it's
handled when the chain reaches it. The three "auto" granularities are distinct fields: `workflow.mode`
(steps), `workflow.execute.loop` (phases), `workflow.execute.parallel` (strategy). Here are the groups
and their defaults:

| Group | Key defaults | What it controls |
|---|---|---|
| `workflow.mode` | `"manual"` | Whether the step chain advances between steps (`manual` stops after the called step; `auto` walks brief → … → complete, firing each step's `run`) |
| `workflow.brief` | `depth: "normal"`, `intensity: "normal"` | How broad/hard Roast-Me pushes during `/crew:brief` |
| `workflow.execute` | `parallel: "auto"`, `loop: "all"`, `maxConcurrent: 3`, `onDeviation: "small-self-major-ask"`, `verify: {default: ["test","smoke","review","harden","simplify"], perPhaseOverride: true}` | The phase loop, parallel strategy, deviation handling, and the nested verify pipeline |
| `workflow.usertest` | `cadence: "per-milestone"` | The **human** acceptance gate at execute's milestone boundary (`off`/`per-phase`/`per-milestone`) — crew proposes a derived 2–10 checkpoint checklist you confirm before ship; holds under `auto`/`dispatch`. A boundary gate, **not** a verify stage or chain step |
| `workflow.ship` | `run: "ask"`, `enabled: true`, `runDeploy: "off"`, `releaseTool: "auto"`, `finishRelease: "off"` | `/crew:ship` release/deploy + its close-out gate (`config.git` stays the git authority) |
| `workflow.learn` | `run: "ask"`, `enabled: true` | `/crew:learn` self-learning + its close-out gate |
| `workflow.complete` | `run: "ask"` | `/crew:complete` milestone close-out + its gate within `/crew:finish` |
| `git` | `autoCommitPerPhase: true`, `autoPush: false`, `isolation: "off"`, `baseBranch: "main"`, `mergeStrategy: "integration-branch"` | Commit/branch/merge behavior; **opt-in** isolation (`*-per-milestone`, `worktree-`/`branch-` mechanism) forking from / merging to `baseBranch`; the **sole** git/remote authority for every `run` — never touches the remote without approval |
| `models` | `mode: "auto"`; planning/review→`opus`, execution/simplify→`sonnet`, trivial→`haiku` | Model per task type (auto tiers or manual pins) |
| `tasks` | `provider: "local"`, `writeBack: false` | External PM integration for `/crew:pull` |
| `testingPolicy` | `"from-archetype"` | TDD / tests-required / optional |
| `security` | `auto: false` | Security pass is **never** automatic — recommended on sensitive scope, run only on approval |
| `notifications` | `enabled: true`, `events: ["blocker","completion"]`, `channel: "os"` | Desktop/push notifications (see hooks) |
| `language` | `files: "en"` | Language of generated project files (separate from conversation language) |
| `responseStyle` | `"concise"` | Verbosity/format of replies: `concise` (short, tables) · `detailed` (full prose) · `auto` |
| `crewVersion` | set on init | Plugin version the config was last reconciled with — drives the update flow |

**Model auto tiers:** planning/review → strongest, execution/simplify → mid, trivial → cheap.
Override precedence: ad-hoc > project > global > built-in default.

**Staying current.** `crewVersion` records the plugin version a config was reconciled with. On session
start crew warns if a project's config is behind the installed plugin; re-running `/crew:init`
(project) or `/crew:setup` (global) — or the dedicated `/crew:update` — enters a **reconcile mode** that
schema-diffs the existing config and asks you about each new field rather than silently applying defaults.
The reconcile can also **offer once** to expand a minimal pre-sentinel config to the full inherit form
(opt-in — existing concrete freezes are never touched, and a declined config stays minimal and correct).

**Registry (`project-types.json`, global layer):** a **tag** is atomic and activates skills/rules; a
**project type (archetype)** is a curated tag bundle + defaults. Picked at `/crew:init`; the resolved
tag-set drives which rules/skills are active. Starter archetypes: `app`, `api-service`, `cli`,
`marketing-site`, `monorepo`.

---

## Architecture

crew is a **pure Claude Code plugin** — four asset types, no build, no runtime code beyond three Node
hook scripts.

### Commands (`commands/*.md`)
The 22 slash commands above. Each is a Markdown file with a `description` (+ `argument-hint`) and a
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
| `crew-context` | `execute`, `resume` — the `.planning/` state model |
| `planning` | `plan`, `execute`, `adjust` — roadmap/phase/spec conventions + DAG |
| `verify` | `verify`, `execute` — the test→smoke→review→harden→simplify pipeline |
| `model-management` | `execute dispatch` + pipeline — task-types and model selection |
| `git-merge` | `execute dispatch` — worktree isolation, claims, rolling integration |
| `roast-me` | `brief`, `init` — bounded clarifying questions with recommended answers |
| `learn` | `learn` — distilling work into proposed skills/tags |

#### Skills as standalone tools

Four of these skills carry a **second entry point** — invoke them ad-hoc, with no `/crew:` command and no `.planning/` state, straight from natural language:

- **`roast-me`** — *the headliner.* Pressure-test any idea on the spot: say **"roast me"** (optionally with a nickname), "roast my idea/plan", or "challenge my idea/plan/assumptions". Works well outside a brief — any time you want a bounded, recommended-answer-carrying challenge.
- **`planning`** — "plan this" / "write me a plan": drafts a milestone→phase plan inline, no roadmap files required.
- **`verify`** — "verify this" / "review my changes": runs test→smoke→review→harden→simplify on any diff, no active phase required.
- **`learn`** — "what's worth keeping here?" / "learn from this": distils reusable skills/tags/decisions from any diff, no finished milestone required.

Each writes nothing to `.planning/` unless you ask — the standalone path returns its result in the conversation.

### Hooks (`hooks/`)
Two Node scripts wired in `hooks/hooks.json`:

- **`SessionStart` → `session-start.mjs`** — primes a new session with crew context.
- **`Notification` → `notify.mjs blocker`** and **`Stop` → `notify.mjs completion`** — fire desktop/
  push notifications on blockers and completions, per `config.notifications`.

---

## Concepts in depth

**Cross-session continuity.** Continuity rides on the committed `.planning/` state — `PROJECT.md` +
`ROADMAP.md` + `LOG.md`; `SessionStart` re-primes a new window and `/crew:resume` reconstitutes from
them. Because `.planning/` is committed, this works across machines and teammates — not just within one
chat.

**The verify pipeline.** `test → smoke → review → harden → simplify`, each in a *fresh* sub-agent context
so reviewers aren't biased by the implementer's reasoning, and each with a model chosen for its task
type. Steps are configurable globally and per-phase. `smoke` runs the built app (command from `PROJECT.md`)
and skips cleanly when none is defined, so a project without a runtime harness stays green.

**The user-test gate.** Distinct from the automated pipeline, `workflow.usertest.cadence`
(`off`/`per-phase`/`per-milestone`, default per-milestone) fires a **human** acceptance checkpoint at
execute's milestone boundary: crew proposes a 2–10 item checklist derived from what was actually built,
you confirm each, and an unaccepted milestone doesn't advance to ship — the gate holds even under
`auto`/`dispatch`. Separate axis from verify: `smoke` is an automated stage, the user-test gate
is a human boundary.

**Parallelism without chaos.** `depends:` edges in `ROADMAP.md` form a DAG; `/crew:execute dispatch`
runs independent phases in isolated worktrees, `claims.json` prevents collisions, and the
`merge-coordinator` performs intent-aware integration. Atomic per-phase commits make `/crew:rollback`
trivial.

**Self-learning.** `/crew:learn` lifts patterns out of one repo into your global registry as skills
and tags — so the next project starts smarter. Nothing is written without your explicit confirmation.

**Safety defaults.** crew never pushes, opens PRs, or runs a security pass automatically. State-
changing actions are confirmed; the security pass requires both a recommendation and your approval.

The **skills are the source of truth** for crew's behavior — see the `skills/*/SKILL.md` files (and
`CLAUDE.md`) for the full design rationale behind each concept.

---

## Contributing

Contributions are welcome — most changes are just editing a Markdown command, agent, or skill. See
[CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md). Releases follow the
[changesets](https://github.com/changesets/changesets) flow — add a changeset (`pnpm changeset`) and a
CI bot opens the version PR. Found a security issue? See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Daniel Baumert
