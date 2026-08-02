---
name: planning
description: Conventions for crew roadmaps and plans — milestone/phase structure, status markers, inter-phase dependencies, and the permanent-`_spec.md`-plus-referencing-phase-plans format. Use when writing or adjusting ROADMAP.md and plans/.
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

The spec/plan concern is **split across two kinds of file** in the milestone folder, not stacked in one — a single source of intent that phase plans reference rather than copy:

- **`_spec.md` — the milestone Spec (permanent).** Written by `/crew:brief`, it owns the **intent**: Goal/problem, Requirements, Acceptance criteria, Out of scope — plus an **optional `Notes for planning`** section (only when the brief actually parked something). It is the single source of truth and stays for the life of the milestone — co-located with `_roadmap.md` once archived, never removed and never duplicated.
  - **`Notes for planning` — the brief→plan handoff.** `/crew:brief` holds the scope line by *parking* structural / sequencing / phasing ideas instead of deciding them ("that's `/crew:plan`, noted"). A `/clear` sits between the two commands, so a parked idea survives **only** if it is written down: capture each as one line here. It is **input for `/crew:plan`, not intent** — `/crew:plan` reads it, decides it, and does **not** treat it as a requirement. Not a to-do list and never a substitute for a requirement: anything load-bearing belongs in Requirements, decided in the brief.
- **`<id>_<title>.md` — a phase plan.** Written by `/crew:plan`, it is the **how** for one phase: a short **Scope of this phase** note (1–3 lines: the deliverable + this phase's own acceptance) that **references `_spec.md`** for the full intent, followed by the Plan body. It does **not** repeat the Spec.

```markdown
# <id> <Phase title>

> **Scope of this phase:** <deliverable in a line or two; phase-local acceptance>.
> **Intent / acceptance / out-of-scope:** see `_spec.md`.

## Plan          ← the how
- affected files
- Tasks: action / pattern to mirror / validation command
- Risks
- Verify configuration for this phase
```

A **ticket plan** (`/crew:pull`) is the exception: there is no `_spec.md` — the ticket is the spec — so the file carries the ticket's intent inline (with `externalRef: <ticket-id>`) above its Plan body.

The ROADMAP milestone section stays lean alongside this — title + a one-line hook + the phase list — so the intent has exactly one home (`_spec.md`), not two.

### Plan file naming & folders

Plans live in **numbered milestone folders** — `plans/<n>_<milestone-slug>/` — keeping a brief together with the phases it spawned. The leading `<n>` is the milestone number (matching `## Meilenstein N` in the roadmap): it makes folders sort correctly and lets you tell which milestone a folder is **while it's collapsed**, without opening it.

**The separator between a number/id and its name is an underscore — never a dot, never a hyphen.** One rule, applied everywhere, so each separator carries exactly one meaning: `_` joins a number or id to its kebab name (milestone folder `1_fundament`, phase plan `1.2_db-schema.md`, ticket plan `LIN-42_realtime-notifications.md`); `.` is reserved purely for the *phase* hierarchy inside an id (`1.2` = phase 2 of milestone 1 — a sub-point, so a dot fits); `-` is reserved purely for the words inside a kebab name. Because a number/id always ends at the `_`, the boundary stays unambiguous even in long names — `1_user-authentication` reads as milestone `1` + slug, whereas `1-user-authentication` would let the number blend into the slug. The `<slug>`/title is lowercase, ASCII/kebab — even when the *content* is written in another language via `config.language.files`. Reordering milestones is rare (unlike phases); when it happens, `/crew:adjust` renames the folder's number prefix along with the roadmap heading.

```
.planning/plans/
  1_fundament/
    _spec.md            ← the milestone Spec (present when a brief produced this milestone; then permanent)
    1.1_backend.md       ← numbered phase plans of this milestone
    1.2_db-schema.md
    1.3_auth.md
```

Files inside a folder are told apart by filename. **A leading underscore marks a meta file, not a phase** — `_spec.md` (the milestone Spec) and `_roadmap.md` (a milestone's archived ROADMAP section, see *Archiving* below); any future `_*.md` is covered by the same rule. Commands that read phase plans skip `_`-prefixed files — they are never a phase. The remaining kinds carry their id up front:

- **Brief / milestone Spec** (`/crew:brief`, feature in an existing project): `_spec.md` — the **permanent** milestone Spec (Goal/problem, Requirements, Acceptance, Out of scope, optional `Notes for planning`). The folder is `<n>_<brief-slug>/`, where `<n>` is the next milestone number; no fake phase number is invented. `/crew:plan` later adds the phase plans beside it — they **reference** this `_spec.md` rather than copy it.
- **Phase plan** (`/crew:plan`): roadmap phase id + short title — `1.2_db-schema.md`. Sorts naturally, ties straight to the roadmap id.
- **Ticket plan** (`/crew:pull`): external ticket id + title — `LIN-42_realtime-notifications.md`; no `_spec.md` (the ticket is the spec).

**New project:** `/crew:plan` creates one `<n>_<milestone-slug>/` folder per roadmap milestone and writes the numbered phase plans into it; the brief itself is `PROJECT.md` (no `_spec.md` in `plans/`). **Feature in an existing project:** the brief's `_spec.md` and its numbered phase plans share one `plans/<n>_<milestone-slug>/` folder; the `_spec.md` is **permanent** — it stays as the milestone's single source of intent (like `_roadmap.md` after archiving), never removed. All plans-reading commands glob **recursively** (`plans/**/*.md`).

## Rename & reference-migration phases

When a phase **renames a symbol, skill, command, or path** — or otherwise updates references across the codebase — the plan's affected-files list is a **starting point, not a boundary**. The exit gate must grep the **whole tracked tree**, not just the files the plan enumerated: the enumerated list routinely misses callers (sibling commands, agents, docs, project memory), and a single missed reference breaks the renamed mention silently. Exclude only **immutable history** where the old name is a deliberate record (e.g. `CHANGELOG.md`, release notes). Make the whole-tree grep an explicit **acceptance criterion** of such phases — a green grep (no stale references outside the excluded history) gates the commit, the plan-listed files alone do not.

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

## Standalone usage

A second entry point: ask this skill to draft a plan **ad-hoc** — "plan this", "write me a plan" — without `/crew:plan`'s roadmap orchestration.

- **State-free.** Don't require an existing `ROADMAP.md`, a milestone folder, or `.planning/` at all. Apply the milestone→phase structure and the `_spec.md`/phase-plan split as **conventions**, not as files that must already exist.
- **Output inline by default.** Emit the plan **in the conversation** rather than writing `plans/<n>_<slug>/` files or touching `ROADMAP.md`. Only persist into `.planning/` when the user asks — or hand off to `/crew:plan` for the full, tracked path.
