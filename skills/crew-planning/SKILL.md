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

One file, two layers (no separate spec file unless `brief.specArtifact: "separate"`):

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

**The separator between a number/id and its name is an underscore — never a dot, never a hyphen.** One rule, applied everywhere, so each separator carries exactly one meaning: `_` joins a number or id to its kebab name (milestone folder `1_fundament`, phase plan `1.2_db-schema.md`, ticket plan `LIN-42_realtime-notifications.md`); `.` is reserved purely for the *phase* hierarchy inside an id (`1.2` = phase 2 of milestone 1 — a sub-point, so a dot fits); `-` is reserved purely for the words inside a kebab name. Because a number/id always ends at the `_`, the boundary stays unambiguous even in long names — `1_command-ux-autonomy` reads as milestone `1` + slug, whereas `1-command-ux-autonomy` would let the number blend into the slug. The `<slug>`/title is lowercase, ASCII/kebab — even when the *content* is written in another language via `config.language.files`. Reordering milestones is rare (unlike phases); when it happens, `/crew:adjust` renames the folder's number prefix along with the roadmap heading.

```
.planning/plans/
  1_fundament/
    _spec.md            ← Spec root (optional; only when a brief produced this work)
    1.1_backend.md       ← numbered phase plans of this milestone
    1.2_db-schema.md
    1.3_auth.md
```

Files inside a folder are told apart by filename. **A leading underscore marks a meta file, not a phase** — `_spec.md` (a brief's Spec root) and `_roadmap.md` (a milestone's archived ROADMAP section, see *Archiving* below); any future `_*.md` is covered by the same rule. Commands that read phase plans skip `_`-prefixed files — they are never a phase. The remaining kinds carry their id up front:

- **Brief / Spec root** (`/crew:brief`, feature in an existing project): `_spec.md` — Spec head only (Goal/problem, Requirements, Acceptance, Out of scope). The folder is `<n>_<brief-slug>/`, where `<n>` is the next milestone number; no fake phase number is invented. The Plan body is filled later by `/crew:plan`.
- **Phase plan** (`/crew:plan`): roadmap phase id + short title — `1.2_db-schema.md`. Sorts naturally, ties straight to the roadmap id.
- **Ticket plan** (`/crew:pull`): external ticket id + title — `LIN-42_realtime-notifications.md`; no `_spec.md` (the ticket is the spec).

**New project:** `/crew:plan` creates one `<n>_<milestone-slug>/` folder per roadmap milestone and writes the numbered phase plans into it; the brief itself is `PROJECT.md` (no `_spec.md` in `plans/`). **Feature in an existing project:** the brief's `_spec.md` and its numbered phase plans share one `plans/<n>_<milestone-slug>/` folder; once every phase is captured, the `_spec.md` may be removed. All plans-reading commands glob **recursively** (`plans/**/*.md`).

## Archiving completed milestones

When a milestone's phases are **all `[x]`** (or `[~]` deferred — non-blocking), `/crew:archive` (or `/crew:complete`, which calls it as its final step) moves it out of the live state to keep `ROADMAP.md` and `plans/` small:

```
.planning/archive/
  plans/<n>_<milestone-slug>/        ← the whole plans folder, moved verbatim
    _roadmap.md                       ← the milestone's former ROADMAP.md section (written in)
    _spec.md                          ← (if the milestone had one)
    <id>_<title>.md                   ← the phase plans
```

One milestone = one folder: the archived ROADMAP section lands **inside** the moved folder as `_roadmap.md`, beside `_spec.md` and the phases — consistent with the `_spec.md` meta-file idiom. The live `ROADMAP.md` keeps a one-liner in place of the section: `## Meilenstein N: <title> — ✓ archiviert YYYY-MM-DD → archive/plans/<n>_<slug>/_roadmap.md`. Archiving is the folder `mv` **plus** writing that one `_roadmap.md` into it. `LOG.md` is never archived — it stays append-only.

**Complete vs. Archive — not aliases.** `/crew:complete` is the full *semantic* close-out (audit → summarize → `PROJECT.md` → archive) and calls `/crew:archive` as its last step; `/crew:archive` is the mechanical *primitive* (the folder `mv` + `_roadmap.md` write) and stays usable on its own for pure tidy-up (e.g. an old milestone that never ran through finish). The done-threshold is identical in both — every phase `[x]` or `[~]` (deferred non-blocking), only `[ ]`/`[>]` block.

## Principles

- Mirror existing codebase patterns; reference real files. Activate stack skills from the project's `tags`.
- Keep phases small enough to verify and commit atomically.
- Flag security-sensitive scope (auth/payments/tokens) and **recommend** a security pass — never enable it silently.
- Plans are living documents: `/crew:adjust` rewrites them freely as understanding changes.
