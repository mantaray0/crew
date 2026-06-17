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
| `plans/<n>_<milestone-slug>/` | Detail per milestone (folder prefixed with the milestone number so it sorts & reads at a glance when collapsed): `_spec.md` (present for brief-driven milestones, then **permanent** — the milestone Spec, single source of intent) + numbered `<id>_<title>.md` phase plans (Scope note + `_spec.md` reference + Plan body each). |
| `backlog/` | Idea inbox — **a folder, one Markdown file per item** (`backlog/<NNN>_<slug>.md`, frontmatter + body); triaged at plan/adjust. Replaces the old single `BACKLOG.md`. See *The backlog* below. |
| `LOG.md` | Append-only history: phase, commit, verify result, token/cost. |
| `claims.json` | Which instance/worktree holds which phase (parallel-safe). |
| `config.json` | Behavior config: cross-cutting top-level (`git`, `models`, `tasks`, …) + the workflow steps under `config.workflow.*` (`brief`/`plan`/`execute`(+`verify`)/`ship`/`learn`/`complete`/`finish`). |
| `archive/` | Completed milestones moved out of live state (`/crew:archive`): `plans/<n>_<slug>/` with the former ROADMAP section written in as `_roadmap.md`. Keeps `ROADMAP.md`/`plans/` small. |
| `reference/` | Load-on-demand knowledge docs (runbooks, domain/data maps, architecture deep-dives) — **never auto-loaded**; each indexed one line in PROJECT.md's `## Reference`. Naming `reference/<topic-slug>.md`. |

`PROJECT.md` is the always-true source; `ROADMAP.md` is the plan; `plans/` is detail; `LOG.md` is history. The plan + log are the external memory — the work survives a fresh context, not the context window.

## The backlog (`backlog/`)

The backlog is a **folder, one Markdown file per item** — `backlog/<NNN>_<slug>.md`, mirroring `plans/`: `<NNN>` is a running, stable ID and `<slug>` is a lowercase ASCII/kebab name. Each file is **frontmatter + body**, like a Claude skill file.

**Frontmatter (YAML header) — machine-read, the source for the `list` table.** Keys, enum values, and dates (ISO `YYYY-MM-DD`) stay **stable English** / language-neutral (structure, like config keys and the `[x]` status markers — every consumer parses them the same way); only `title`, `description`, and the body prose follow `config.language.files`:

```yaml
---
id: 007
title: <short name>           # follows language.files
priority: medium              # low · medium · high (default medium)
status: open                  # open · planned · promoted · dropped (default open)
created: 2026-06-16
due:                          # optional, may be empty
description: <one sentence>   # follows language.files
---
```

**Body — the Key Facts block + free-form context** (human-readable, follows `language.files`; the block labels stay stable English). Every Key Fact is optional **except a usable "Why"**:

```markdown
## Key Facts
- **Why / Motivation:** …      (required — the context that evaporates first)
- **Affected area:** …         (commands / skills / config / files)
- **Constraints:** …           (optional)
- **Open questions:** …        (optional)
- **Evidence / Links:** [[…]]  (optional — related items, `[[…]]` style)
- **Acceptance note:** …       (optional)
```

…followed by free-form prose.

**Required minimum (against gold-plating).** Only the **`id`** + a **usable Key Facts block** (at least a "Why") are mandatory. `priority`/`status` carry defaults; `due` and any extra fields are optional.

**Handoff contract.** When an item is promoted, `/crew:brief` and `/crew:plan` read the frontmatter + Key Facts and **seed** the brief/plan from them — they pick up what was captured and ask only the **gaps**, instead of starting cold. `add` actively asks **Why + Affected area** (the two that go missing most often); the rest is progressive/optional.

**IDs & lifecycle.** IDs are **monotonic and never reused** (gaps are fine — like `plans/`, which never renumbers). When an item is folded (`promoted`) or `dropped`, its **file is removed**, so `list` and every consumer show only **living** items (`open`/`planned`). The `status` value therefore lives only as long as the item does — `promoted`/`dropped` are transient end states just before removal; a promoted item's history then lives in the roadmap/plan, not the backlog.

**No generated index — by design.** There is deliberately **no** generated `BACKLOG.md` (or any other index file). The item files' **frontmatter is the single source of truth**; the overview is produced on demand by `/crew:backlog list`. This keeps the backlog drift-free and stops a later agent from "regenerating the index".

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
