---
name: crew-planning
description: Conventions for crew roadmaps and plans — milestone/phase structure, status markers, inter-phase dependencies, and the spec-head-in-plan format. Use when writing or adjusting ROADMAP.md and plans/.
origin: crew
---

# crew Planning Conventions

## ROADMAP.md

Plain Markdown, milestones → phases. Status markers:

- `[ ]` open · `[>]` active (claimed) · `[x]` done (append ` — erledigt YYYY-MM-DD`) · `[~]` deferred

```markdown
## Meilenstein 1: Fundament
- [x] 1.1 Backend-Struktur     — erledigt 2026-06-12
- [>] 1.2 DB-Schema (Drizzle)  @worktree-a
- [ ] 1.3 Auth                 (depends: 1.2)
```

Phases are identified by their heading text, **not** by rigid numbers — so inserting/reordering (via `/crew:adjust`) is a text edit, never a renumber. Each phase should be independently mergeable. Record dependencies inline (`depends: …`) so `/crew:dispatch` can build a DAG and parallelize independent phases.

## plans/<milestone-slug>/<file>.md

One file, two layers (no separate spec file unless `clarify.specArtifact: "separate"`):

```markdown
# <Feature/Phase/Ticket>

## Spec          ← the what/why (from /crew:brief or an external ticket)
- Goal / problem
- Requirements
- Acceptance criteria
- Out of scope
- externalRef: <ticket-id>   ← only when pulled via /crew:pull

## Plan          ← the how
- affected files
- Tasks: action / pattern to mirror / validation command
- Risks
- Verify configuration for this phase
```

### Plan file naming & folders

Plans live in **milestone folders** — `plans/<milestone-slug>/` — keeping a brief together with the phases it spawned. The folder name is a slug (not a number), so inserting/reordering via `/crew:adjust` never renumbers a folder. `<milestone-slug>` is lowercase, ASCII/kebab (even when the *content* is written in another language via `config.language.files`).

```
.planning/plans/
  <milestone-slug>/
    _spec.md            ← Spec root (optional; only when a brief produced this work)
    1.2-db-schema.md     ← numbered phase plans of this milestone
    1.3-auth.md
```

Three file kinds inside a folder, told apart by filename:

- **Brief / Spec root** (`/crew:brief`, feature in an existing project): `_spec.md` — Spec head only (Goal/problem, Requirements, Acceptance, Out of scope). The brief slug *becomes* the milestone-folder name, so no fake phase number is invented. The Plan body is filled later by `/crew:plan`.
- **Phase plan** (`/crew:plan`): roadmap phase id + short title — `1.2-db-schema.md`. Sorts naturally, ties straight to the roadmap id.
- **Ticket plan** (`/crew:pull`): external ticket id + title — `LIN-42-realtime-notifications.md`; no `_spec.md` (the ticket is the spec).

**New project:** `/crew:plan` creates one `<milestone-slug>/` folder per roadmap milestone and writes the numbered phase plans into it; the brief itself is `PROJECT.md` (no `_spec.md` in `plans/`). **Feature in an existing project:** the brief's `_spec.md` and its numbered phase plans share one `plans/<milestone-slug>/` folder; once every phase is captured, the `_spec.md` may be removed. All plans-reading commands glob **recursively** (`plans/**/*.md`).

## Principles

- Mirror existing codebase patterns; reference real files. Activate stack skills from the project's `tags`.
- Keep phases small enough to verify and commit atomically.
- Flag security-sensitive scope (auth/payments/tokens) and **recommend** a security pass — never enable it silently.
- Plans are living documents: `/crew:adjust` rewrites them freely as understanding changes.
