---
name: crew-conventions
description: How crew runs every command — the step-by-step interaction flow (surface every decision via free-text / single-select / multi-select, batch the independent ones in a stepper, stay sequential on dependencies, never silently applying defaults) and language (respond in the user's language; repo content stays English). Apply at the start of every crew command.
origin: crew
---

# crew Conventions

These apply to **every** crew command.

## Resolve the config before step 1

A command that *obeys* a config field must **read it first** — before its first step, not on demand mid-flow. Resolve every `config.*` field its steps reference (`.planning/config.json` → `~/.claude/crew/config.json` → built-in default), per `crew-config` → *Resolving inherited fields*. That section is the rule; don't re-derive it.

- **A written `"inherit"` is not a value** — it resolves one layer down. A field left unresolved is **not** "the default", it is **no instruction at all**, and the behavior it was supposed to steer silently disappears.
- **Never let a behavior hang on an unresolved field.** Every instruction that scales with a config value carries its own **unconditional baseline** — the built-in default's behavior — so the command still acts correctly outside a crew project or with no `.planning/` at all.
- **Resolve silently.** This is a read, not a question; it produces no stepper entry. Surface a resolved value only where a command explicitly reports it (`crew-config` → *Surfacing the source*).

## Interaction flow — drive it, don't shortcut it

crew is interactive on purpose. Do not jump ahead, do not silently apply defaults, and do not let other context pull you out of the flow.

- **Surface every decision — batch the independent ones.** Walk the command's steps in order and ask the user **before** acting on any decision. **Bundle independent decisions into one `AskUserQuestion` stepper batch** — questions whose order doesn't matter and whose options don't depend on each other (clarification gray-areas, multi-field setup forms). **Stay sequential** as soon as one decision's options hinge on a prior answer (a decision-tree branch) or it is a confirm-then-write gate. Batching is for *co-equal* questions — never an excuse to skip a question or silently apply a default.
- **Each option is a real question**, in the form that fits:
  - **free-text** for open values (project name, a description, a custom stack entry),
  - **single-select** for one-of-fixed choices (an archetype, merge strategy, model mode),
  - **multi-select** for picking several (which tags, which verify steps, which notification events).
- **Never auto-apply a default.** A default is the *recommended* answer the user confirms — present it as the pre-selected / first option, not as a decision already made. "I'll just use the defaults" is only allowed if the user explicitly says so.
- **Confirm, then write.** Persist files/config only after the relevant questions are answered. Summarize what will be written, then proceed.
- **Stay in the flow.** If something unrelated comes up mid-flow, capture it (e.g. to the backlog) and return to the current step — don't abandon the questioning.

The point: the user steers each option deliberately. Speed comes from good recommended answers, **not** from skipping the questions.

## Language

- **Respond to the user in the user's language.** Detect it from how they write and match it (a German user gets German, a Spanish user Spanish, …).
- **The plugin repo stays English / neutral** — commands, agents, skills, code, commit messages, and config keys remain English so the plugin is universal.
- **The user's project files follow `config.language.files`.** The content crew writes into a project — `PROJECT.md`, `ROADMAP.md`, `LOG.md`, `plans/`, `backlog/` — is written in `config.language.files` (default `"en"`). Ask for it at `/crew:setup` (global default) or `/crew:init` (per project). Section headings / structure stay stable; the prose follows the chosen language.

## Command naming

**One command per verb; variants are space-arguments.** Pass a mode or target as `$ARGUMENTS` / `$1` — e.g. `/crew:execute [phase]`, `/crew:execute auto`, `/crew:backlog [idea|list|new]`. Do **not** mint a hyphenated command (`crew:execute-auto`) for what is really a mode of an existing verb.

- **Hyphenated files only as thin alias wrappers.** A separate file is acceptable solely as a discoverable alias that forwards to the canonical verb — it carries **no logic of its own**.
- **Document the args.** Keep the command's `argument-hint` and description in sync with the variants it accepts.

## Workflow steps

Work moves through a small, predictable step chain. The **config sections are named after the steps** and live under `config.workflow.*`, so the config reads as the workflow (self-documenting). `crew-config` → *Workflow model* is the contract; this is its execution-facing mirror.

```
brief → plan → execute ( → verify ) → ship → learn → complete
```

**Two levels — never conflate them:**

- **Level 1 — `config.workflow.mode` (`manual` | `auto`)** sits *above* the chain: does it advance between steps? `manual` (default) = do the one called step and **stop** (the `run` gates stay dormant); `auto` = walk the chain, each step firing per its `run`, in the close-out order **Ship → Learn → Complete**.
- **Level 2 — per-step `run` (`off` | `ask` | `auto` | `smart`)** decides how a step is handled *when the chain reaches it*: `off` skip (standalone command still usable), `ask` ask at the boundary, `auto` run unasked, `smart` the agent judges and runs it if worthwhile.

Per step:

- **brief** (`config.workflow.brief`) / **plan** (`config.workflow.plan`, uses `models.planning`) — **always interactive**, no `run` gate.
- **execute** (`config.workflow.execute`) — pure plan-execution, no skip-gate; it only *produces* commits. Owns its phase loop (`execute.loop` `one|all`), strategy (`execute.parallel`), and the verify pipeline.
- **verify** (`config.workflow.execute.verify`) — the **test → smoke → review → harden → simplify** pipeline, run inside execute per phase; a list, **never** a `run`-gate, never auto-skipped. Also callable standalone via `/crew:verify`.
- **ship / learn / complete** (`config.workflow.{ship,learn,complete}`) — the gateable close-out steps, each carrying `run`. `/crew:finish` orchestrates them (Ship → Learn → Complete) by reading their `run`s. execute *suggests* finish at a milestone's end under `manual`, never runs it.

Cross-cutting config (`git`, `models`, `tasks`, `testing`, …) stays **top-level**, not under `workflow`. **Safety boundary:** `config.git` is the sole git/remote authority for **every** `run` including `auto`/`smart` — "run the step?" and "touch the remote/prod?" are orthogonal axes (see `crew-config`).

## Workflow vocabulary — three granularities

The same idea "runs through" lives on three distinctly named fields, so **`auto` is never ambiguous**:

| level | what advances | field |
|---|---|---|
| Workflow steps | brief → … → complete | `workflow.mode: manual \| auto` |
| Phases in execute | phase 1 → 2 → 3 … of the milestone | `workflow.execute.loop: one \| all` |
| Execution strategy | phases serial vs. parallel (worktrees) | `workflow.execute.parallel: auto \| manual \| off` |

`loop`/`parallel` exist only on `execute` (only it has phases); other steps are single actions. `smart` (a step's `run`) = the agent decides whether the step is worthwhile and runs it if so. `crew-config` is the contract for the exact fields and defaults — mirror it here, never define divergently.

## Catch-up rule

When a **later** step is invoked directly while an **earlier** close-out step in the same milestone hasn't run yet, the step **detects** the gap (from `LOG.md` / state) and **offers the missing earlier step(s) per their `run`**: `auto` → catch up, `ask` → ask, `smart` → judge, `off` → ignore. This is light awareness — **not** a dependency graph and **never** forced. Commands reference this rule rather than restating it.

## Response style

Honour `config.responseStyle` (resolved project-over-global; default `"concise"`) in every command reply:

- **`concise`** — lead with the conclusion. Prefer a **table** for comparisons, findings, option lists, and trade-offs; keep surrounding prose to a few lines. No preamble, no restating the question.
- **`detailed`** — full narrative prose: show reasoning, walk through findings, explain trade-offs at length.
- **`auto`** — choose per content: a table when the content is a structured comparison/finding list, prose when it's a narrative explanation.

This governs *format and length only*. It never changes the interaction flow above — you still surface every decision (batching only the independent ones) and never skip questions, whatever the style. If no config is present (e.g. outside a crew project), default to `concise`.
