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

  // ── workflow: the steps, as first-class objects ────────────────────────────
  // Two levels (see "Workflow model" below): workflow.mode advances the *step*
  // chain (brief→…→complete); each gateable step's `run` decides how it's handled
  // when the chain reaches it.
  "workflow": {
    "mode": "manual",                  // "manual" | "auto" — Level 1: manual = do the one called step and stop (run-gates dormant); auto = walk the chain, each step firing per its run
    "brief": {                         // always interactive — no run gate (see "Safety boundary")
      "depth": "normal",               // "light" | "normal" | "deep" — how broad (coverage)
      "intensity": "normal"            // "gentle" | "normal" | "brutal" — how hard Roast-Me pushes back
    },
    "plan": {},                        // always interactive — no run gate
    "execute": {
      "parallel": "auto",              // "auto" | "manual" | "off" — strategy granularity: phases serial vs parallel (worktrees)
      "loop": "all",                   // "all" (default) | "one" — phase granularity: loop the milestone's phases, or one phase then stop
      "maxConcurrent": 3,
      "onDeviation": "small-self-major-ask", // | "always-ask" | "autonomous"
      "verify": {                      // verify is PART of execute (runs every phase); also callable standalone via /crew:verify. NOT a run-gated step — never auto-skipped.
        "default": ["test", "smoke", "review", "harden", "simplify"], // first stage is "test" (build/typecheck/tests); "smoke" runs the built app (command from PROJECT.md) and is skipped cleanly when no smoke/E2E command is defined; the pipeline & command stay named "verify"
        "perPhaseOverride": true
      }
    },
    "usertest": {                      // human acceptance gate — NOT a chain step, NOT a verify stage; execute owns it at the milestone boundary (see commands/execute.md)
      "cadence": "per-milestone"       // "off" | "per-phase" | "per-milestone" — when the human-test gate fires; cadence-based, NOT a run-gate (a human can't be "auto"-run)
    },
    "ship": {
      "run": "ask",                    // "off" | "ask" | "auto" | "smart" — Level 2 gate (fires under mode:auto / the finish strand)
      "enabled": true,                 // is /crew:ship available here? (orthogonal to run; replaces the old mode:off)
      "provider": "gh-actions",        // "gh-actions" | "gitlab-ci"
      "tagPattern": "v{version}",
      "environments": [],              // optional named environments (prod, staging, …)
      "runDeploy": "off",              // "off" | "ask" | "auto" — run an imperative deploy command after the git steps? off = push-triggered CI (the push IS the deploy)
      "releaseTool": "auto",           // "auto" | "changesets" | "release-please" | "semantic-release" | "manual" | "none" — how the version is decided
      "finishRelease": "off"           // "off" | "ask" | "auto" — merge an open bot version-PR (phase 2); only meaningful for changesets/release-please
    },
    "learn": {
      "run": "ask",                    // "off" | "ask" | "auto" | "smart" — gate (was config.finish.retro)
      "enabled": true                  // per-milestone cadence (was config.retro.enabled)
    },
    "complete": {
      "run": "ask"                     // "off" | "ask" | "auto" | "smart" — audit → summary → archive; standalone /crew:complete, called by /crew:finish as its final step (wraps /crew:archive)
    },
    "finish": {}                       // orchestrator only — runs Ship → Learn → Complete in that order, reading each step's `run`; carries no gate of its own (see "config.workflow.finish")
  },

  // ── cross-cutting: top-level, not part of the step chain ────────────────────
  "git": {
    "autoCommitPerPhase": true,        // atomic commit after a verified phase
    "autoPush": false,                 // never touch the remote without approval
    "autoPR": false,
    "commitPattern": "conventional",   // commit-message shape: the "conventional" shortcut (type(scope): subject) OR a free template — placeholders {type} {scope} {ticket} {subject} {body}; an empty optional placeholder and its adjacent separators collapse. e.g. "[{type}] {ticket}: {subject}" → "[feat] add login" when no ticket
    "branchPattern": "feat/{slug}",
    "baseBranch": "main",              // fork/integration target for isolation branches; override per project (e.g. "redesign") — not the Changesets `baseBranch` (different namespace)
    "isolation": "off",                // | "worktree-per-milestone" | "branch-per-milestone" — opt-in milestone isolation; off = linear (worktree is the preferred mechanism)
    "mergeStrategy": "integration-branch", // | "pr" | "ask-each"
    "askBeforeMerge": false,
    "conflictPolicy": "resolve-or-ask"  // | "always-ask" | "autonomous"
  },
  "models": {
    "mode": "auto",                    // | "manual"
    "planning": "opus", "execution": "sonnet", "review": "opus",
    "simplify": "sonnet", "trivial": "haiku"
  },
  "tasks": { "provider": "local", "writeBack": false, "projectKey": null },
  "testingPolicy": "from-archetype",   // | "tdd" | "tests-required" | "optional" — top-level leaf (beside language/security/responseStyle)
  "security": { "auto": false },       // never auto; recommended on sensitive scope
  "notifications": {
    "enabled": true,
    "events": ["blocker", "completion"],
    "channel": "os"                    // "os" | "push:ntfy" | "push:pushover" | "off"
  },
  "observability": { "trackCost": true },
  "language": { "files": "en" },
  "responseStyle": "concise",          // "concise" | "detailed" | "auto" — verbosity/format of the assistant's command replies (see crew-conventions)
  "projectType": null,
  "tags": [],
  "stack": {}
}
```

This block is the **layer contract** — the built-in defaults, always **concrete**. Being the bottom layer, it may **never** carry `"inherit"` (a `"inherit"` here would have nothing to resolve down to; `validate-plugin` enforces it). It is **not** what a project file looks like: `/crew:init`/`/crew:setup` write the **full inherit form** (see *A written project config* below).

**`config.git` isolation & base branch.** `isolation` is a single **milestone-level** switch — pick the *mechanism*: `worktree-per-milestone` (preferred) or `branch-per-milestone`, so different people/agents can take a whole milestone in parallel. `off` (the default) is **linear** — isolation is **opt-in**, so an unconfigured project is never surprised with a branch. *Phase*-level isolation is **not** a config value: it is intrinsic to `dispatch`, which always gives each parallel phase its own worktree (nested under the milestone branch when milestone isolation is on). A set value takes effect in the **sequential** `/crew:execute` too, not only in `dispatch`. Isolation branches **fork from** and **merge back into** `baseBranch` (default `main`) — set `baseBranch: "redesign"` and nothing lands on `main` automatically (the final merge to `main` stays manual). The full mechanic lives in the `git-merge` skill; here only the contract and defaults. *(`git.baseBranch` is unrelated to the same-named Changesets option in `.changeset/config.json`.)*

Auto model tiers: planning/review → strongest, execution/simplify → mid, trivial → cheap. `manual` uses the per-type ids. Override precedence: ad-hoc > project > global > built-in default. The `models.*` keys are model **tiers** (e.g. `models.execution` = the execution-task tier) — not to be confused with the `workflow.execute` step section.

## A written project config (full inherit form)

The `config.json (full defaults)` block above is the **layer contract** (built-in defaults, always concrete). What `/crew:init` and `/crew:setup` actually **write** is the *full inherit form*: every inheritable leaf present, inheriting ones as the sentinel `"inherit"`, project facts concrete (see *Inherit-first writes* for the rule). A fresh project `config.json` looks like this:

```jsonc
{
  "crewVersion": "0.19.0",              // project fact — concrete (illustrative: the reconciled plugin version)
  "workflow": {
    "mode": "inherit",
    "brief":   { "depth": "inherit", "intensity": "inherit" },
    "plan":    {},
    "execute": {
      "parallel": "inherit", "loop": "inherit", "maxConcurrent": "inherit",
      "onDeviation": "inherit",
      "verify": { "default": "inherit", "perPhaseOverride": "inherit" }
    },
    "usertest": { "cadence": "inherit" },
    "ship": {
      "run": "inherit", "enabled": "inherit", "provider": "inherit",
      "tagPattern": "inherit", "environments": "inherit", "runDeploy": "inherit",
      "releaseTool": "inherit", "finishRelease": "inherit"
    },
    "learn":    { "run": "inherit", "enabled": "inherit" },
    "complete": { "run": "inherit" },
    "finish":   {}
  },
  "git": {
    "autoCommitPerPhase": "inherit", "autoPush": "inherit", "autoPR": "inherit",
    "commitPattern": "inherit", "branchPattern": "inherit", "baseBranch": "inherit",
    "isolation": "inherit", "mergeStrategy": "inherit", "askBeforeMerge": "inherit",
    "conflictPolicy": "inherit"
  },
  "models": {
    "mode": "inherit", "planning": "inherit", "execution": "inherit",
    "review": "inherit", "simplify": "inherit", "trivial": "inherit"
  },
  "tasks": { "provider": "inherit", "writeBack": "inherit", "projectKey": "inherit" },
  "testingPolicy": "tests-required",    // archetype suggestion — written concrete when picked, else "inherit"
  "security": { "auto": "inherit" },
  "notifications": { "enabled": "inherit", "events": "inherit", "channel": "inherit" },
  "observability": { "trackCost": "inherit" },
  "language": { "files": "inherit" },
  "responseStyle": "inherit",
  "projectType": "cli",                 // project fact — concrete
  "tags": ["bun"],                      // project fact — concrete
  "stack": { "language": "TypeScript", "runtime": "Bun" } // project fact — concrete
}
```

Only **leaf** fields take `"inherit"`; container objects (`workflow`, `git`, …) stay as nesting, and leafless ones (`plan`, `finish`) stay `{}`. A leaf whose value is itself a list or object (e.g. `workflow.execute.verify.default`, `notifications.events`) inherits **as a whole** — `"inherit"` replaces the entire value, never a per-element merge. At `/crew:setup` the same form is written one layer down (leaves inherit the **built-in default** instead of global). This example is illustrative — it must **never** be confused with the concrete defaults block; the guard in `validate-plugin` keeps the two apart.

## Workflow model (canonical vocabulary)

crew's workflow is **two levels, named so "auto" is never ambiguous**. `crew-conventions` carries the same vocabulary for command authors.

**Level 1 — `config.workflow.mode`** (does the chain advance between *steps*?):

| `mode` | behavior |
|---|---|
| `manual` *(default)* | The agent does **the one** called step and **stops**. The per-step `run` gates are **dormant** — after `execute` it neither chains to `ship` nor asks. (Today's behavior.) |
| `auto` | The agent **advances itself**: after each step it asks "what's next?" and acts **per that step's `run`**, in the close-out order **Ship → Learn → Complete**. |

**Level 2 — per-step `run`** (how a step is handled *when the chain reaches it* — i.e. under `mode: auto`, or at the one-phase milestone-end hand-off):

| `run` | who decides | behavior |
|---|---|---|
| `off` | nobody | step not in the flow (its standalone command stays usable by hand) |
| `ask` | you | crew asks at the step boundary → runs on yes |
| `auto` | you, in advance | runs without asking |
| `smart` | the agent | the agent judges whether it's worthwhile and runs it if so |

Only the gateable close-out steps carry `run` (`ship`, `learn`, `complete`). `brief`/`plan` are **always interactive** (no `run`); `execute` has no skip-gate — it runs its phase loop + verify pipeline; `verify` is a pipeline list, never a `run`-gate.

**Three granularities — the "auto" disambiguation.** The same idea "runs through" lives on three distinctly named fields, so it is never ambiguous:

| level | what advances | field |
|---|---|---|
| Workflow steps | brief → … → execute → ship → learn → complete | `workflow.mode: manual \| auto` |
| Phases *in* execute | phase 1 → 2 → 3 … of the milestone | `workflow.execute.loop: one \| all` |
| Execution strategy | phases serial vs. parallel (worktrees) | `workflow.execute.parallel: auto \| manual \| off` |

`loop`/`parallel` are **execute-specific** (only `execute` has phases). Other steps are single actions; their internal pauses come from `config.git` and the `run` gate, not from a parallel/loop knob. ("Work through the milestone" = the old `/crew:execute auto` = `execute.loop: all`; "split phases" = the old `dispatch` = `execute.parallel`.)

**Safety boundary (load-bearing).** `config.git` stays the **sole git/remote authority** for **every** `run` value, including `auto` **and** `smart`: "run the step?" (`run`) and "touch the remote/prod?" (`git.autoPush`/`autoPR`, `workflow.ship.enabled`) are orthogonal axes. Even if a `smart` step "decides to ship", crew does **not** push/PR without approval when `git.autoPush=false`. And `verify` is **never** auto-skipped — it is a pipeline list, not a `run`-gate.

**`language.files`** sets the language of the project files crew writes (`PROJECT.md`, `ROADMAP.md`, `LOG.md`, `plans/`, `backlog/`). Default `"en"`; ask the user at `/crew:setup` (global) or `/crew:init` (per project). This is separate from the *conversation* language (see `crew-conventions`): the plugin repo and config keys stay English, but the user's own project files may be written in their language.

**`responseStyle`** controls how verbose and how formatted the assistant's command replies are. `crew-conventions` enforces it. Default `"concise"`.

| value | behavior |
|---|---|
| `concise` (default) | Short answers. Lead with the conclusion. Use a **table** for comparisons, findings, trade-offs, or option lists; keep prose to a few lines. |
| `detailed` | Full prose explanations — narrative findings, reasoning shown, longer walkthroughs. |
| `auto` | Pick per content: table for structured comparisons/findings, prose for narrative explanation. |

Resolved through the normal layering — a project's `.planning/config.json` overrides the global default (e.g. global `concise`, one project `detailed`).

**`config.workflow.brief.intensity`** controls how hard Roast-Me challenges an idea during `/crew:brief` — it drives **both the tone** of the pushback **and the drill-depth** (how many forced challenge rounds must happen before Roast-Me's Spec-Probe is allowed to stop). **Orthogonal** to `workflow.brief.depth`: `depth` = how *broad* the questioning (which branches get covered), `intensity` = how *hard* it pushes back **and how deep it drills before it may stop**. The recommended answer carries in every level (in `brutal` it may be "drop this"). Default `"normal"`. Ask at `/crew:setup` (global) or `/crew:init` (per project), resolved project > global > default — like `language.files`.

| value | tone + minimum drill-depth |
|---|---|
| `gentle` | Pure clarification: fill gaps, recommend a default, don't push back. Spec-Probe stops as soon as the Spec is writable — **no** forced rounds. |
| `normal` (default) | Push on the load-bearing weak spots, name obvious scope-creep, question one or two load-bearing assumptions. **At least one** forced challenge round before the Spec-Probe may stop. |
| `brutal` | Attack assumptions ("do you actually need this?"), surface contradictions, steelman cutting scope, name every scope risk. **Several** mandatory rounds — every load-bearing assumption explicitly attacked — before stopping. |

**`config.workflow.ship`** drives `/crew:ship` (release/deploy). Layered global < project; ask at `/crew:setup` and `/crew:init`. Provider `gh-actions` (via `gh`) or `gitlab-ci` (via `glab`). Its `run` (off/ask/auto/smart) is the close-out gate; the fields below are ship's own mechanics.

| field | behavior |
|---|---|
| `run` (default `ask`) | The close-out gate (Level 2) — fires under `workflow.mode: auto` / the finish strand. Orthogonal to `enabled`: `run` decides *whether the chain runs ship*, `enabled` whether ship is available at all. |
| `enabled` (default `true`) | Is `/crew:ship` available for this project? `false` → ship explains how to turn it on and stops. Replaces the old `mode: off`. |
| `runDeploy` (default `off`) | The one knob `config.git` does **not** cover: does crew run an **imperative** deploy command after the git steps? `off` = push-triggered CI (the push *is* the deploy). `ask`/`auto` = imperative world (Vercel/Fly), command sourced from `reference/deploy.md`. |
| `provider` | `gh-actions` (PRs/status via `gh`) or `gitlab-ci` (MRs/status via `glab`). |
| `tagPattern` | Release tag shape, e.g. `v{version}`. |
| `environments` | Optional named environments (prod, staging, …). |
| `releaseTool` (default `auto`) | How the version is decided — `changesets` / `release-please` (a CI bot opens a version-PR) · `semantic-release` (CI decides autonomously, no PR) · `manual` (local `npm version`/equivalent) · `none` (no versioning). `auto` detects from the repo (see `deploy` → Release mechanics). Replaces ship's old hardcoded Changesets check. |
| `finishRelease` (default `off`) | Bot-PR tools only: does ship merge an **open** version/release-PR (phase 2 → CI tags+releases)? `off`/`ask`/`auto`. Meaningless for `manual`/`semantic-release`/`none`. |

**`config.git` is the single git authority.** ship has **no** deploy-specific push axis: every git step (commit/push/PR/merge) defers to `config.git` (`autoCommitPerPhase` / `autoPush` / `autoPR` / `mergeStrategy`). In a push-triggered setup the prod trigger *is* the push — so it belongs to `git.autoPush` (default false → ask), i.e. to the user. ship degrades gracefully — a local `version+commit+tag` is a valid partial result when push/PR are declined.

**`config.workflow.finish`** is the milestone-close **orchestrator** — it runs **Ship → Learn → Complete** in that fixed order. It has **no gate block of its own** (the old `config.finish.{ship,retro,complete}` tri-states have **dissolved** into the steps' own `run`): `/crew:finish` reads `workflow.ship.run`, `workflow.learn.run`, `workflow.complete.run` and `workflow.mode`, then orchestrates. It invents no logic — it **delegates all three steps** to their own commands (`/crew:ship`, `/crew:learn`, `/crew:complete`); the Complete close-out (audit → summary → archive, wrapping `/crew:archive`) lives in the standalone **`/crew:complete`** command, which finish calls as its final step.

| close-out step | gate (`run`) | extra gating |
|---|---|---|
| `ship` | `workflow.ship.run` (default `ask`) | also hard-gated by `config.workflow.ship.enabled`; `config.git` (`autoPush`/`autoPR`) stays the git authority — finish adds **no** new push/release axis. Never ships on a red verify. |
| `learn` | `workflow.learn.run` (default `ask`) | gated by `config.workflow.learn.enabled`; cadence is **per milestone** (no per-phase learn). |
| `complete` | `workflow.complete.run` (default `ask`) | audit → summary → archive; the standalone **`/crew:complete`** command, called by `/crew:finish` as the final close-out step (wraps `/crew:archive`); only archives once all phases are `[x]`/`[~]`, else the step stops with a note. |

A step whose `run` is `off`, or that is disabled/not-applicable, is **skipped cleanly**, not aborted. `/crew:execute` only ever *suggests* `/crew:finish` at a milestone's end under `mode: manual` — it never runs it (the autonomy contract's "never self-ship/-complete" holds); under `mode: auto` the chain advances and each step fires per its `run`.

**`config.stack`** is the **single source of truth** for the project's stack *facts* (language / app / db / orm / …) — it drives tag-based reviewer selection and grounding. `PROJECT.md` shows the stack as a **derived mirror** and carries the *why* (architecture decisions); it is **not** a second place to edit the facts. Change the stack in `config.stack`; crew updates the `PROJECT.md` table to match. The stack is standing context — it stays in the auto-loaded `PROJECT.md`, never in load-on-demand `reference/`.

## Inherit-first writes (canonical)

How `/crew:init`, `/crew:setup`, and the reconcile path (`/crew:update`) **write** config. The runtime read-side (`defaults < global < project` layering) is unchanged — this governs only what gets *written* into a `config.json`, so a project stays dynamically coupled to the layer below unless the user deliberately freezes a value. init/setup/update **reference** this section rather than restating it.

**Inherit-first per leaf field.** Every config-driven question offers, as its **first and pre-selected** option, the *inherit* choice:

- project level (`/crew:init`): **"take from global"**,
- global level (`/crew:setup`): **"take the built-in default"** — same mechanic, only the label differs (there is no layer under global except the schema defaults).

The inherit option **names the value it currently resolves to**, e.g. *"take from global (currently: `normal`)"*. The command reads the layer below to show it (`/crew:init` reads `~/.claude/crew/config.json`; `/crew:setup` shows the built-in default); if nothing is set there, it shows the built-in default. Below the inherit option follow the actual value choices.

**Inherit → write the sentinel `"inherit"`.** Choosing inherit writes the field with the literal value **`"inherit"`** — it is **present** in the written `config.json`, so the user sees the knob exists and that it inherits; resolution still happens at runtime through the layering (a reader treats `"inherit"` exactly like a missing key — see *Resolving inherited fields*). This deliberately **reverses** the older "omit the key" rule: inheritance is now **visible in the file**, not implied by absence.

**Full form — every inheritable leaf is written.** A fresh `config.json` contains **all** inheritable leaf fields with full object nesting (`workflow.*`, `git.*`, `models.*`, `notifications.*`, `testingPolicy`, `language`, `responseStyle`, …); each is either a **concrete value** (freeze) or **`"inherit"`**. **Project facts** — `projectType`, `tags`, `stack`, `crewVersion` — are always **concrete**, never `"inherit"` (they describe *this* project; they don't inherit). See *A written project config* for the full shape.

**Tri-rule (backward-compatible).** Three written states, two of which resolve identically:

| written | meaning |
|---|---|
| concrete value | **frozen** — fixed for this level even if the layer below later drifts |
| `"inherit"` | **dynamically inherits** the layer below |
| key missing / deleted | **≡ `"inherit"`** — inherits identically |

So every existing minimal `config.json` stays correct **unchanged**: the sentinel is purely **additive visibility**, not a new runtime path.

**Explicit value → always write, even when equal to the inherited value.** Picking a concrete value writes it — *even if it equals what the layer below currently resolves to*. That is the deliberate **freeze**: the value stays fixed for this project/level if the lower layer later drifts. **Not** choosing inherit **is** the freeze decision.

**Recommended answer = inherit, except detected/project-specific values.** The pre-selected answer is inherit, so fast click-through *inherits* rather than freezes. Two exceptions recommend the concrete value instead:

- `workflow.ship.releaseTool` when `auto`-detection identified a tool from the repo,
- `testingPolicy` from the chosen archetype — now an ordinary top-level leaf in the same inherit-first flow (no nested special-case): the inherit choice first (the level-dependent label above), the archetype's suggestion (e.g. `tests-required`) is the **recommended** explicit choice, written as a snapshot when picked. Its `"from-archetype"` default is just the built-in value the inherit option resolves to. (Archetype exception is init-time only; `/crew:setup` treats it like any other inherit-first field.)

**ship is asked per leaf field.** `workflow.ship.*` (`enabled`, `provider`, `releaseTool`, `runDeploy`, `tagPattern`, `environments`, `finishRelease`, `run`) each gets its own inherit-first question — **no** block-level shortcut, consistent with the other workflow gates (`execute.loop`/`parallel`, the `run`s). The one dependency: `enabled` is asked **first** (trunk-before-leaves); if it resolves to off, the dependent ship fields are skipped; the independent ones are batched.

**Three ways a field drops back to inheritance** — all the same underlying act (set the field to `"inherit"`; a deleted key inherits identically), distinct in *when* and *scope*:

| way | when | scope |
|---|---|---|
| **Reset** | any time, in the reconcile | a single already-set override → `"inherit"` |
| **One-time inherit-first cleanup** | once, at the inherit-first schema transition (gated on `crewVersion` < `0.16.0`; see *Known migrations*) | batched: all inherited-looking fields a pre-inherit-first config over-seeded |
| **Revisit pass** | opt-in step on any re-run | re-asks *every* inheritable/workflow field (same inherit-first form, current value pre-selected) → change or reset any |

## Resolving inherited fields (read-side contract)

**Canonical resolution rule — every reader obeys this.** A field whose written value is `"inherit"` **and** a field whose key is **absent** resolve **identically**: to the value one layer down — `project → global → built-in defaults`, and `global → built-in defaults`. A **concrete** value resolves to itself (freeze). **No reader ever yields `"inherit"` as an effective value** — resolution always bottoms out at the built-in defaults (always concrete), so the literal sentinel can never survive to a consumer. This holds at **both** the project and the global level.

<!-- inherit-resolution-contract: stable marker for validate-plugin (leak-protection guard); keep the sentence above intact -->

**Readers that implement this rule:**

- **Commands** — `/crew:init`, `/crew:setup`, `/crew:update` (reconcile), `/crew:status`, and any command that surfaces a resolved value. They follow the contract **mentally** (markdown-first, no compiled normalizer).
- **The `notify` hook** (JavaScript) — resolves `notifications.*` layer-by-layer at runtime; it implements the rule **locally** in JS. It must never compare against, nor emit, the literal `"inherit"`.
- **The reconcile procedure** — diffs the live config and renders resolved values + their source.

**Not a reader of inheritable fields:** `session-start.mjs` reads only `crewVersion` — a **project fact**, always concrete, never `"inherit"` — so it needs no resolution logic and **no change**.

**Mechanic: per-reader, no central normalization point.** There is deliberately **no** single `resolve()` chokepoint — consistent with crew's *no-compiled-validator / markdown-first* architecture. Agents and commands honor the contract by reading this section; the one runtime reader (the JS hook) implements it inline. This section is the **single source** of the rule; every reader **references** it rather than re-deriving it.

**Surfacing the source (resolved value + origin).** Because `config.json` is strict JSON (no comments), the file value of an inheriting field stays the bare `"inherit"`; the **resolved value and where it came from** are shown by a command/report, in this one canonical form:

> `` `language.files`: inherit → `de` (from global) `` · `` `responseStyle`: inherit → `concise` (from default) ``

A frozen (concrete) field shows just its value, no arrow. This single phrasing is what the reconcile report (init/setup/update) and `/crew:status` reuse — they do not re-invent it.

## Config versioning & migration

`crewVersion` records the crew plugin version this config was last reconciled with. The **current** plugin version lives in `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` (`version`).

- **On scaffold** (`/crew:init`, `/crew:setup` first run): write `crewVersion` = the current plugin version.
- **On session start:** the `session-start` hook compares the project's `config.crewVersion` against the plugin version and, if they differ (or `crewVersion` is missing), prints a one-line "config may be out of date — run `/crew:update` to reconcile" notice.
- **On re-run** of `/crew:setup` (global config) or `/crew:init` (project config): if the config already exists, enter **reconcile mode** instead of scaffolding:
  1. **Schema-diff.** Compare the existing config's keys against this schema (the contract). Classify each: **new** (in the schema, missing from the config), **removed** (in the config, no longer in the schema), **unchanged**. A changed *default* in this schema is never written back over a value the user already has.
  2. **Ask per new field — inherit-first.** For every new key, show the user its purpose and recommended default (from this schema) and ask what they want — as the fitting question type (single-select for enums like `responseStyle`, free-text for open values), following `crew-conventions`. Per *Inherit-first writes*, the **inherit** choice is the first, pre-selected option and writes nothing when chosen. Never silently apply a default.
  3. **Flag removed fields.** List keys that no longer exist in the schema; offer to drop them.
  4. **One-time cleanup of legacy over-seeding.** When the config predates the inherit-first release (`crewVersion` < `0.16.0`; see the inherit-first entry under *Known migrations*), offer — **once** — a batched reset of all inheritable fields whose written value equals the resolved inherited value (the old write logic over-seeded them). Candidates are pre-selected; deliberate freezes the user keeps stay as values. This is **version-gated** (runs only at that transition) and does **not** recur on later reconciles.
  5. **Reset & revisit (any re-run).** Independently of the one-time cleanup: a single already-set override can be **reset** to inherit (key removed) at any time, and the reconcile offers an **opt-in revisit pass** — re-ask *every* inheritable/workflow field with the same inherit-first form (current value pre-selected) so any parameter can be changed or reset. Declining leaves the reconcile purely additive (lossless). The revisit reuses the first-run question form — no second question logic.
  6. **Stamp the version.** After applying confirmed changes, set `crewVersion` to the current plugin version.

  This is a procedure, not a coded migration: there is no compiled migrator — diff the live config against this schema and drive the questions from it. See *Inherit-first writes* for the write rule these steps follow.

### Known migrations

The schema-diff is generic, but some changes are **renames/splits/moves** where a blind new/removed diff would drop the user's value. Apply these explicitly *before* the generic diff. The chain must carry a config from `crewVersion 0.7.0` (flat legacy keys) **through the section-rename migration to the workflow-nesting migration** (into `config.workflow`) **losslessly** — apply the two groups in order (a config of any vintage lands on the same post-nesting shape).

**Group 1 — 0.7.0 → section renames** (lift flat legacy keys to their renamed sections):

| change | mapping |
|---|---|
| `clarify` → `brief` | values 1:1 (`depth`/`intensity`; `askOnlyWhenStuck` is **dropped by the workflow-nesting migration** — see Group 2) |
| `execution` → `execute` | values 1:1 (`parallel`/`maxConcurrent`/`onDeviation`) |
| `deploy` → `ship` | values 1:1 — includes the legacy `deploy.mode` submigration below |
| `learn` → `retro` | values 1:1 (`enabled`) — **reversed again by the workflow-nesting migration** (`retro` → `learn`); a 0.7.0 `learn` ends up at `workflow.learn` net |
| `deploy.mode` removed → `ship.enabled` + `ship.runDeploy` | `off` → `enabled: false` · `orchestrate` → `enabled: true, runDeploy: off` · `execute` → `enabled: true, runDeploy: ask` |

**Group 2 — section renames → workflow-nesting: into `config.workflow`** (then move the renamed sections under `workflow`, nest verify, dissolve finish):

| change | mapping |
|---|---|
| `brief` → `workflow.brief` | move; carry `depth`/`intensity`; **drop** `askOnlyWhenStuck` (removed) |
| `execute` → `workflow.execute` | move; `parallel`/`maxConcurrent`/`onDeviation` 1:1 |
| `verify` → `workflow.execute.verify` | move **and nest under execute**; in the `default` stage list rename the first stage `"verify"` → `"test"` (`perPhaseOverride` stays a boolean; the same stage-name rename applies to any per-phase override lists, which live in plan files, not here) |
| `ship` → `workflow.ship` | move 1:1; its new `run` is seeded from `finish.ship` (below) |
| `retro` → `workflow.learn` | rename **and** move; `enabled` 1:1; its new `run` is seeded from `finish.retro` |
| `complete` → `workflow.complete` | new section; its `run` is seeded from `finish.complete` |
| `finish.{ship,retro,complete}` → `workflow.{ship,learn,complete}.run` | the tri-state `finish` values map 1:1 onto the steps' `run`; the `config.finish` block then **disappears** (no longer a section) |
| removed: `config.loop`, `config.state`, `brief.askOnlyWhenStuck` | **dropped** — `loop.maxIterations`/`state.commitSessions` were never read (dead); `brief.askOnlyWhenStuck` is superseded. Flag & confirm the drop; never silently keep. |
| removed: `specArtifact` (in any vintage — `workflow.brief.specArtifact`, the pre-nesting `brief.specArtifact`, or the 0.7.0 `clarify.specArtifact`) | **dropped on reconcile with a note** — `_spec.md` is now always written and permanent, so the artifact choice is moot. A prior value of `off` is **ignored** (the always-write behaviour is intended). Remove the key; surface the change in the reconcile summary. |

**Genuinely new fields** (no predecessor → offered via the per-new-field question, never set silently): `workflow.mode` (default `manual`), `workflow.execute.loop` (default `all`), `workflow.usertest.cadence` (default `per-milestone`; `off`/`per-phase`/`per-milestone`), `git.baseBranch` (default `main` — recommend inherit; the explicit value is only for a project collecting work on a non-`main` integration branch), and `run` on any close-out step lacking a `finish.*` source — e.g. a pristine 0.7.0 config (no `finish` block) gets `ship.run`/`learn.run`/`complete.run` from this schema's defaults (`ask`/`ask`/`ask`).

The new `smoke` stage in `workflow.execute.verify.default` needs **no** migration line — the stage list inherits **as a whole** (`"inherit"` keeps resolving to the current default, now including `smoke`). A config that has **frozen** `verify.default` to a concrete array gets `smoke` only via the opt-in revisit pass; a frozen array without `smoke` means "this project pinned its stages", **not** "smoke off".

**Inherit-first cleanup — one-time** (gated on `crewVersion` predating `0.16.0`, the inherit-first release; runs **once** at that transition, like the groups above). Before that release, init/setup wrote inheritable leaf fields explicitly even when the user chose "inherit", so configs from before it over-seed the layer below. A written value that equals the resolved inherited value is **not** distinguishable after the fact from a deliberate freeze → **no auto-strip**. Instead, at the inherit-first reconcile, detect every inheritable leaf field whose written value equals the resolved inherited value (project: vs. global; global: vs. built-in default) and present them as **one batched multi-select** — *"these look inherited — reset to inherit? (key removed)"* — with candidates **pre-selected**. The user un-checks deliberate freezes (kept as values). After the choice and the `crewVersion` stamp the migration does **not** re-run — later reconciles have nothing to flag, since the inherit-first write logic never over-seeds. This is distinct from the always-available per-field **reset** and the opt-in **revisit pass** (see *Inherit-first writes* → the three ways a field drops back to inheritance).

**`git.commitStyle` → `git.commitPattern`** — rename, value 1:1. The field was effectively single-value (`"conventional"` was the only meaning), so a pre-existing config can only carry `"conventional"` — which stays a valid `commitPattern` (the keyword shortcut). After the rename `commitPattern` additionally accepts a free template (placeholders `{type}`/`{scope}`/`{ticket}`/`{subject}`/`{body}`). Carry the old value under the new key; never silently drop it.

**`testing.policy` → top-level `testingPolicy`** — rename + flatten, value 1:1. The single-field `testing` section collapses to one top-level leaf (beside `language`/`security`/`responseStyle`). Carry the existing `testing.policy` value under the new `testingPolicy` key (`from-archetype`/`tdd`/`tests-required`/`optional`); never silently drop. The old nested inherit special-case disappears — `testingPolicy` is now an ordinary inherit-first leaf.

**`git.isolation` enum reduced** (phase granularity removed — `isolation` is now a pure milestone switch; phase isolation lives only as `dispatch`-intrinsic behavior) — gated on `crewVersion` predating the isolation-reduction release (`< 0.20.0`; if ship cuts a different version, align this number there — describe it as "the isolation-reduction release", never by an internal label). The earlier two-axis enum shipped in `0.18.0`, so a released config may already carry a `*-per-phase` value — the gate must cover those, not only pre-two-axis configs. Map every prior value losslessly onto the three-value set (`off` · `worktree-per-milestone` · `branch-per-milestone`), **never silently drop**: `linear` → `off`; `worktree-per-feature` → `off`; `branch-per-feature` → `off`; `worktree-per-phase` → `off`; `branch-per-phase` → `off`; `worktree-per-milestone` / `branch-per-milestone` → 1:1. The phase-granular values resolve to `off` because phase isolation is no longer a config choice — `dispatch` isolates each phase automatically regardless of this key, so nothing is lost. **Keep the default note** (unchanged since the isolation-model release): a config *without* an `isolation` key resolves to `off` — this reduction does **not** re-flip the default, it only shortens the value list. Surface the reduction in the reconcile summary (five values → three; any `*-per-feature`/`*-per-phase`/`linear` value moved to `off`).

**`config.json` → full inherit form (opt-in expansion)** — gated on `crewVersion` predating the explicit-inherit-sentinel release (`< 0.19.0`; if ship cuts a different version, align this number there — describe it as "the explicit-inherit-sentinel release", never by an internal label). **No automatic rewrite:** a pre-sentinel config (inheriting fields simply *absent*) keeps working unchanged (missing ≡ `"inherit"`; see *Tri-rule*). At reconcile, `/crew:update` **offers once** to **expand** the config to the full inherit form — write every inheritable leaf that is currently absent as `"inherit"`, leaving existing concrete values (deliberate freezes) untouched. The user may decline; declining leaves the config minimal and equally correct. This is **opt-in additive visibility**, never forced. (Fresh `/crew:init`/`/crew:setup` already write the full form.)

**`BACKLOG.md` → `backlog/*.md` (content migration)** — gated on `crewVersion` predating the backlog-folder release (`< 0.21.0`; if ship cuts a different version, align this number there — describe it as "the backlog-folder release", never by an internal label). **crew's first *content* migration** — the reconcile otherwise only touches `config.json`. Runs **only** when a legacy free-text `.planning/BACKLOG.md` exists; a project that already has no `BACKLOG.md` and a `backlog/` folder is **skipped** (a re-run creates no duplicates → idempotent). Convert **losslessly**: each backlog entry (a `## <title>` section or a dated `- [YYYY-MM-DD] <idea>` bullet) → one `backlog/<NNN>_<slug>.md` (frontmatter + body, format → `crew-context` → *The backlog*): assign **running IDs** from `001`; derive `created` from a leading `[YYYY-MM-DD]` prefix (else ask — never guess a date; leave empty only if there is genuinely none to recover); default `priority: medium`, `status: open`; the prose → `description` (one sentence) + the **Key Facts** block (the remaining context, with a best-effort "Why"). **Interactive on ambiguity** — unclear titles/dates/splits → ask (`crew-conventions`), never guess. After a **confirmed** conversion, **remove** the old `.planning/BACKLOG.md` and **note it in the reconcile summary** — never silently drop it (convert → confirm → remove).

Also: if a `.planning/DEPLOY.md` exists, note in the reconcile that its content now belongs in `reference/deploy.md` (structured fields → `config.workflow.ship`); offer to move it (a `mv` + the user trims to prose). Never auto-delete it.

## File naming in `.planning/`

- **Documents are UPPERCASE:** `PROJECT.md`, `ROADMAP.md`, `LOG.md` (like `README`/`CHANGELOG`).
- **Data files are lowercase:** `config.json`, `claims.json`.
- **Directories are lowercase:** `plans/`, `backlog/` (item files: `<NNN>_<slug>.md` — see `crew-context` → *The backlog*).

## `project-types.json` (starter registry — global layer)

A **tag** is atomic and activates skills/rules; a **project type (archetype)** is a curated tag bundle + defaults. Pick one at `/crew:init`; the project's resolved tag-set drives which rules/skills are active. (An archetype's `defaults.testing` deliberately keeps its short name here but seeds the config's top-level `testingPolicy` — see `resolveArchetype` below.)

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

`resolveArchetype(name)` = look up the archetype → seed `projectType`, `tags`, `stack`, and `testingPolicy` (from the archetype's `defaults.testing`) into the project's `config.json`. Stack-specific skill names (hono-api, drizzle-postgres, …) are referenced here for when those skills are added; they don't need to exist yet.
