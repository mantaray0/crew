---
name: crew-context
description: How crew holds project state across sessions — the .planning state model and what each file owns. Use when reading/writing .planning state or resuming work.
origin: crew
---

# crew Context & State

## The `.planning/` files (committed)

| File | Owns |
|---|---|
| `PROJECT.md` | The living project truth: architecture decisions (the *why*), current state, constraints, a **stack table mirrored from `config.stack`** (the source of truth), plus an optional `## Reference` index. Loaded automatically at session start. |
| `ROADMAP.md` | The fahrplan: milestones → phases with status markers + timestamps. |
| `plans/<n>_<milestone-slug>/` | Detail per milestone (folder prefixed with the milestone number so it sorts & reads at a glance when collapsed): optional `_spec.md` (Spec root) + numbered `<id>_<title>.md` phase plans (Spec head + Plan body each). |
| `BACKLOG.md` | Idea inbox; triaged at plan/adjust. |
| `LOG.md` | Append-only history: phase, commit, verify result, token/cost. |
| `claims.json` | Which instance/worktree holds which phase (parallel-safe). |
| `config.json` | Behavior config: cross-cutting top-level (`git`, `models`, `tasks`, …) + the workflow steps under `config.workflow.*` (`brief`/`plan`/`execute`(+`verify`)/`ship`/`learn`/`complete`/`finish`). |
| `archive/` | Completed milestones moved out of live state (`/crew:archive`): `plans/<n>_<slug>/` with the former ROADMAP section written in as `_roadmap.md`. Keeps `ROADMAP.md`/`plans/` small. |
| `reference/` | Load-on-demand knowledge docs (runbooks, domain/data maps, architecture deep-dives) — **never auto-loaded**; each indexed one line in PROJECT.md's `## Reference`. Naming `reference/<topic-slug>.md`. |

`PROJECT.md` is the always-true source; `ROADMAP.md` is the plan; `plans/` is detail; `LOG.md` is history. The plan + log are the external memory — the work survives a fresh context, not the context window.

## Reference docs

`reference/` holds **long-form, durable knowledge** that would bloat `PROJECT.md` — deployment runbooks, domain/data-source maps, architecture deep-dives. The whole point is **context economy**:

- **Load-on-demand, never at start.** The session-start hook loads only `PROJECT.md`. A reference doc enters context **only when the task touches its area** — so the standing context stays small.
- **Indexed in `PROJECT.md`.** A `## Reference` section lists each doc as one line — link + what it covers + when to read it — so an agent knows what exists *without* loading it:
  ```markdown
  ## Reference
  - [deploy](reference/deploy.md) — Coolify/Hetzner runbook: env, migrations, rollback. *Read before deploy changes.*
  ```
- **Header convention.** Each doc opens with a title + one bold line, so the index entry derives from it and a skim reveals relevance:
  ```markdown
  # <Title>
  **Reference ·** <what it covers>. **Read when:** <trigger>.
  ```
- **One topic per doc** (`reference/<topic-slug>.md`, lowercase/kebab); split when a doc grows broad so loading it pulls only relevant context.
- Freeform knowledge agents consult on demand — `/crew:ship`, for instance, loads `reference/deploy.md` because shipping touches the deploy area.

## Cross-session continuity

Continuity rides on the **committed `.planning/` state**, not on a separate snapshot file: `PROJECT.md` (the always-true project truth + decisions), `ROADMAP.md` (phase status), and `LOG.md` (append-only history — per-phase results, key decisions, deviations, and the next step). A fresh context re-orients from these; the work survives because it lives in the plan and the log, not in the context window. `/crew:resume` reads `PROJECT.md` + the active `ROADMAP.md` phase + the `LOG.md` tail and produces a briefing.
