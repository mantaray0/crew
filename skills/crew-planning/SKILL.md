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

Phases are identified by their heading text, **not** by rigid numbers — so inserting/reordering (via `/crew:adjust`) is a text edit, never a renumber. Each phase should be independently mergeable. Record dependencies inline (`depends: …`) so `/crew:execute dispatch` can build a DAG and parallelize independent phases.

## plans/<n>_<milestone-slug>/<file>.md

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

Plans live in **numbered milestone folders** — `plans/<n>_<milestone-slug>/` — keeping a brief together with the phases it spawned. The leading `<n>` is the milestone number (matching `## Meilenstein N` in the roadmap): it makes folders sort correctly and lets you tell which milestone a folder is **while it's collapsed**, without opening it.

**The separator is an underscore (`<n>_<slug>`, e.g. `1_fundament`) — never a dot.** Three separators, three meanings, kept distinct so a name reads unambiguously: `_` joins the milestone number to its name (`1_fundament`), `.` builds the *phase* hierarchy inside the folder (`1.2` = phase 2 of milestone 1 — a sub-point, so a dot fits), and `-` is the kebab slug. A folder named `1.0-…` would read like a version/decimal and collide visually with the phase ids — that's exactly why the milestone separator is `_`. `<milestone-slug>` is lowercase, ASCII/kebab (even when the *content* is written in another language via `config.language.files`). Reordering milestones is rare (unlike phases); when it happens, `/crew:adjust` renames the folder's number prefix along with the roadmap heading.

```
.planning/plans/
  1_fundament/
    _spec.md            ← Spec root (optional; only when a brief produced this work)
    1.1-backend.md       ← numbered phase plans of this milestone
    1.2-db-schema.md
    1.3-auth.md
```

Three file kinds inside a folder, told apart by filename:

- **Brief / Spec root** (`/crew:brief`, feature in an existing project): `_spec.md` — Spec head only (Goal/problem, Requirements, Acceptance, Out of scope). The folder is `<n>_<brief-slug>/`, where `<n>` is the next milestone number; no fake phase number is invented. The Plan body is filled later by `/crew:plan`.
- **Phase plan** (`/crew:plan`): roadmap phase id + short title — `1.2-db-schema.md`. Sorts naturally, ties straight to the roadmap id.
- **Ticket plan** (`/crew:pull`): external ticket id + title — `LIN-42-realtime-notifications.md`; no `_spec.md` (the ticket is the spec).

**New project:** `/crew:plan` creates one `<n>_<milestone-slug>/` folder per roadmap milestone and writes the numbered phase plans into it; the brief itself is `PROJECT.md` (no `_spec.md` in `plans/`). **Feature in an existing project:** the brief's `_spec.md` and its numbered phase plans share one `plans/<n>_<milestone-slug>/` folder; once every phase is captured, the `_spec.md` may be removed. All plans-reading commands glob **recursively** (`plans/**/*.md`).

## Archiving completed milestones

When a milestone's phases are **all `[x]`**, `/crew:archive` (or `/crew:complete-milestone`) moves it out of the live state to keep `ROADMAP.md` and `plans/` small:

```
.planning/archive/
  roadmap-<n>_<milestone-slug>.md   ← the milestone's former ROADMAP.md section
  plans/<n>_<milestone-slug>/        ← the whole plans folder, moved verbatim
```

The live `ROADMAP.md` keeps a one-liner in place of the section: `## Meilenstein N: <title> — ✓ archiviert YYYY-MM-DD → archive/roadmap-<n>_<slug>.md`. A pure `mv` (the milestone-folder structure makes it content-free). `LOG.md` is never archived — it stays append-only.

## Principles

- Mirror existing codebase patterns; reference real files. Activate stack skills from the project's `tags`.
- Keep phases small enough to verify and commit atomically.
- Flag security-sensitive scope (auth/payments/tokens) and **recommend** a security pass — never enable it silently.
- Plans are living documents: `/crew:adjust` rewrites them freely as understanding changes.
